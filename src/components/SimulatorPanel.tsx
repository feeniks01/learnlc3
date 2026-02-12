'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { LC3VM, assemble } from '@/lib/lc3';
import { getSavedCode, saveCode } from '@/lib/storage';
import CodeEditor from './CodeEditor';

interface SimulatorPanelProps {
  initialCode?: string;
  storageKey?: string;
  input?: string;
  onOutput?: (output: string) => void;
  compact?: boolean;
}

function toHex(n: number, pad: number = 4): string {
  return (n & 0xFFFF).toString(16).toUpperCase().padStart(pad, '0');
}

function toSigned(n: number): number {
  if (n >= 0x8000) return n - 0x10000;
  return n;
}

function StatRow({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-1 text-xs">
      <span className="text-text-dim">{label}</span>
      <span className="font-mono text-accent">
        {value.toLocaleString()}{unit ? <span className="text-text-dimmer ml-1">{unit}</span> : null}
      </span>
    </div>
  );
}

export default function SimulatorPanel({ initialCode, storageKey, input, onOutput, compact = false }: SimulatorPanelProps) {
  const [code, setCode] = useState(() => {
    if (storageKey) {
      const saved = getSavedCode(storageKey);
      if (saved !== null) return saved;
    }
    return initialCode || `.ORIG x3000
; Write your LC-3 code here

HALT
.END`;
  });
  const [vm] = useState(() => new LC3VM());
  const [registers, setRegisters] = useState<number[]>(Array(8).fill(0));
  const [prevRegisters, setPrevRegisters] = useState<number[]>(Array(8).fill(0));
  const [pc, setPc] = useState(0x3000);
  const [cc, setCc] = useState({ n: false, z: true, p: false });
  const [output, setOutput] = useState('');
  const [consoleInput, setConsoleInput] = useState(input || '');
  const [errors, setErrors] = useState<string[]>([]);
  const [assembled, setAssembled] = useState(false);
  const [halted, setHalted] = useState(false);
  const [running, setRunning] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const keyCaptureRef = useRef<HTMLDivElement>(null);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [memoryStart, setMemoryStart] = useState(0x3000);
  const [memoryView, setMemoryView] = useState<{ addr: number; val: number }[]>([]);
  const [instructionCount, setInstructionCount] = useState(0);
  const [stats, setStats] = useState({ instructionsExecuted: 0, memoryReads: 0, memoryWrites: 0, branchesTaken: 0, branchesNotTaken: 0 });
  const [codeSize, setCodeSize] = useState(0);
  const [tab, setTab] = useState<'registers' | 'memory' | 'console' | 'stats'>('registers');
  const sourceMapRef = useRef<Map<number, number>>(new Map());
  const originRef = useRef(0x3000);

  // Auto-save code with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!storageKey) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveCode(storageKey, code), 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [code, storageKey]);

  const updateState = useCallback(() => {
    const state = vm.getState();
    setPrevRegisters([...registers]);
    setRegisters(Array.from(state.registers).map(r => r & 0xFFFF));
    setPc(state.pc);
    setCc(state.cc);
    setOutput(state.output);
    setHalted(state.halted);
    setInstructionCount(state.instructionsExecuted);
    setStats(state.stats);

    const line = sourceMapRef.current.get(state.pc);
    setActiveLine(line || null);

    // Update memory view
    const mem: { addr: number; val: number }[] = [];
    for (let i = 0; i < 32; i++) {
      const addr = (memoryStart + i) & 0xFFFF;
      mem.push({ addr, val: state.memory[addr] });
    }
    setMemoryView(mem);

    if (onOutput) onOutput(state.output);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm, memoryStart, onOutput]);

  const handleAssemble = useCallback(() => {
    vm.reset();
    setOutput('');
    setErrors([]);
    setActiveLine(null);
    setInstructionCount(0);

    const result = assemble(code);

    if (result.errors.length > 0) {
      setErrors(result.errors.map(e => `Line ${e.line}: ${e.message}`));
      setAssembled(false);
      return false;
    }

    vm.load(result.origin, result.machineCode);
    vm.inputBuffer = consoleInput;
    sourceMapRef.current = result.sourceMap;
    originRef.current = result.origin;
    setMemoryStart(result.origin);
    setCodeSize(result.machineCode.length);
    setAssembled(true);
    setHalted(false);
    updateState();
    return true;
  }, [code, consoleInput, vm, updateState]);

  const handleStep = useCallback(() => {
    if (!assembled || halted) {
      if (!handleAssemble()) return;
    }
    vm.step();
    updateState();
    if (vm.waitingForInput) {
      setWaitingForInput(true);
      setTab('console');
      setTimeout(() => keyCaptureRef.current?.focus(), 50);
    }
  }, [assembled, halted, vm, updateState, handleAssemble]);

  const executeRun = useCallback(() => {
    setRunning(true);
    const runChunk = () => {
      const result = vm.run(50000);
      updateState();
      if (result.waitingForInput) {
        setRunning(false);
        setWaitingForInput(true);
        setTab('console');
        setTimeout(() => keyCaptureRef.current?.focus(), 50);
      } else if (result.completed) {
        setRunning(false);
      } else {
        setErrors(['Program did not halt within 50,000 instructions. Possible infinite loop.']);
        setRunning(false);
      }
    };
    setTimeout(runChunk, 10);
  }, [vm, updateState]);

  const handleRun = useCallback(() => {
    if (!assembled || halted) {
      if (!handleAssemble()) return;
    }
    vm.inputBuffer = consoleInput;
    executeRun();
  }, [assembled, halted, consoleInput, vm, executeRun, handleAssemble]);

  const handleKeyCapture = useCallback((e: React.KeyboardEvent) => {
    if (!waitingForInput) return;

    let char: string | null = null;
    if (e.key === 'Enter') {
      char = '\n';
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      char = e.key;
    }

    if (char === null) return;
    e.preventDefault();

    vm.inputBuffer += char;
    vm.waitingForInput = false;
    setWaitingForInput(false);
    executeRun();
  }, [waitingForInput, vm, executeRun]);

  const handleReset = useCallback(() => {
    vm.reset();
    setAssembled(false);
    setHalted(false);
    setRunning(false);
    setWaitingForInput(false);
    setOutput('');
    setErrors([]);
    setActiveLine(null);
    setInstructionCount(0);
    setPrevRegisters(Array(8).fill(0));
    setRegisters(Array(8).fill(0));
    setPc(0x3000);
    setCc({ n: false, z: true, p: false });
    setMemoryView([]);
  }, [vm]);

  useEffect(() => {
    if (assembled) {
      const mem: { addr: number; val: number }[] = [];
      for (let i = 0; i < 32; i++) {
        const addr = (memoryStart + i) & 0xFFFF;
        mem.push({ addr, val: vm.memory[addr] });
      }
      setMemoryView(mem);
    }
  }, [memoryStart, assembled, vm]);

  const h = compact ? 'h-[500px]' : 'h-full';

  return (
    <div className={`flex flex-col ${h} bg-bg`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
        <button
          onClick={handleAssemble}
          className="px-3 py-1 text-xs font-medium bg-surface-2 text-text-dim hover:text-text border border-border rounded transition-colors"
        >
          Assemble
        </button>
        <button
          onClick={handleStep}
          disabled={running || waitingForInput}
          className="px-3 py-1 text-xs font-medium bg-surface-2 text-text-dim hover:text-text border border-border rounded transition-colors disabled:opacity-40"
        >
          Step
        </button>
        <button
          onClick={handleRun}
          disabled={running || halted || waitingForInput}
          className="px-3 py-1 text-xs font-medium bg-accent text-white border border-accent-dim rounded transition-colors disabled:opacity-40"
        >
          {running ? 'Running...' : waitingForInput ? 'Waiting...' : 'Run'}
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-1 text-xs font-medium bg-surface-2 text-text-dim hover:text-text border border-border rounded transition-colors"
        >
          Reset
        </button>
        <div className="flex-1" />
        {assembled && (
          <span className="text-[11px] text-text-dimmer">
            {instructionCount} instructions
            {halted && ' — halted'}
            {waitingForInput && ' — waiting for input'}
          </span>
        )}
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code editor */}
        <div className="flex-1 overflow-hidden border-r border-border">
          <CodeEditor
            value={code}
            onChange={setCode}
            activeLine={activeLine}
          />
        </div>

        {/* Right panel */}
        <div className="w-72 min-w-72 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border bg-surface">
            {(['registers', 'memory', 'console', 'stats'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-2 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors ${
                  tab === t ? 'text-accent border-b border-accent' : 'text-text-dimmer hover:text-text-dim'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'registers' && (
              <div className="p-3">
                <div className="space-y-1">
                  {registers.map((val, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between px-2 py-1 rounded font-mono text-xs ${
                        val !== prevRegisters[i] ? 'register-changed' : ''
                      }`}
                    >
                      <span className="text-text-dim">R{i}</span>
                      <div className="flex gap-3">
                        <span className="text-accent">x{toHex(val)}</span>
                        <span className="text-text-dimmer w-16 text-right">{toSigned(val)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 border-t border-border space-y-1">
                  <div className="flex items-center justify-between px-2 py-1 font-mono text-xs">
                    <span className="text-text-dim">PC</span>
                    <span className="text-accent">x{toHex(pc)}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 font-mono text-xs">
                    <span className="text-text-dim">CC</span>
                    <div className="flex gap-2">
                      <span className={cc.n ? 'text-error font-bold' : 'text-text-dimmer'}>N</span>
                      <span className={cc.z ? 'text-warning font-bold' : 'text-text-dimmer'}>Z</span>
                      <span className={cc.p ? 'text-success font-bold' : 'text-text-dimmer'}>P</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'memory' && (
              <div className="p-3">
                <div className="flex gap-1 mb-2">
                  <input
                    type="text"
                    className="flex-1 px-2 py-1 text-xs font-mono bg-surface-2 border border-border rounded text-text"
                    placeholder="Address (e.g. x3000)"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const input = (e.target as HTMLInputElement).value.trim();
                        let addr: number;
                        if (input.startsWith('x') || input.startsWith('X')) {
                          addr = parseInt(input.slice(1), 16);
                        } else {
                          addr = parseInt(input);
                        }
                        if (!isNaN(addr)) setMemoryStart(addr & 0xFFFF);
                      }
                    }}
                  />
                  <button
                    onClick={() => setMemoryStart(originRef.current)}
                    className="px-2 py-1 text-xs bg-surface-2 border border-border rounded text-text-dim hover:text-text"
                  >
                    Origin
                  </button>
                </div>
                <div className="space-y-0 font-mono text-[11px]">
                  {memoryView.map(({ addr, val }) => (
                    <div
                      key={addr}
                      className={`flex items-center justify-between px-2 py-0.5 rounded ${
                        addr === pc ? 'bg-accent/10 text-accent' : ''
                      }`}
                    >
                      <span className="text-text-dimmer">x{toHex(addr)}</span>
                      <span className={val !== 0 ? 'text-text' : 'text-text-dimmer'}>
                        x{toHex(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'console' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-text-dimmer mb-1">Output</div>
                  <pre className="font-mono text-xs text-success whitespace-pre-wrap min-h-[60px] bg-surface p-2 rounded border border-border">
                    {output || '\u00A0'}
                  </pre>
                </div>
                {waitingForInput && (
                  <div className="px-3 pb-3">
                    <div
                      ref={keyCaptureRef}
                      tabIndex={0}
                      onKeyDown={handleKeyCapture}
                      className="px-3 py-3 bg-surface-2 border-2 border-warning/50 rounded focus:border-warning focus:outline-none cursor-text"
                    >
                      <div className="text-[10px] uppercase tracking-widest text-warning mb-1 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                        Waiting for keypress
                      </div>
                      <div className="text-xs text-text-dim">
                        Type a key — each keypress is sent immediately.
                        <span className="inline-block w-[5px] h-[14px] bg-warning/70 ml-0.5 animate-pulse align-text-bottom" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="p-3 border-t border-border">
                  <div className="text-[10px] uppercase tracking-widest text-text-dimmer mb-1">Pre-fill Input Buffer</div>
                  <input
                    type="text"
                    className="w-full px-2 py-1.5 text-xs font-mono bg-surface-2 border border-border rounded text-text"
                    placeholder="Characters for GETC/IN..."
                    value={consoleInput}
                    onChange={e => setConsoleInput(e.target.value)}
                  />
                  <div className="text-[10px] text-text-dimmer mt-1">Set before running. Characters are consumed one at a time.</div>
                </div>
              </div>
            )}

            {tab === 'stats' && (
              <div className="p-3">
                {!assembled ? (
                  <div className="text-xs text-text-dimmer py-4 text-center">Assemble and run to see stats.</div>
                ) : (
                  <>
                    <div className="text-[10px] uppercase tracking-widest text-text-dimmer mb-3">Execution</div>
                    <div className="space-y-2 mb-4">
                      <StatRow label="Instructions" value={stats.instructionsExecuted} />
                      <StatRow label="Memory reads" value={stats.memoryReads} />
                      <StatRow label="Memory writes" value={stats.memoryWrites} />
                      <StatRow label="Branches taken" value={stats.branchesTaken} />
                      <StatRow label="Branches skipped" value={stats.branchesNotTaken} />
                    </div>

                    <div className="text-[10px] uppercase tracking-widest text-text-dimmer mb-3 mt-5">Program</div>
                    <div className="space-y-2 mb-4">
                      <StatRow label="Code size" value={codeSize} unit="words" />
                      <StatRow label="Code size" value={codeSize * 2} unit="bytes" />
                    </div>

                    {stats.branchesTaken + stats.branchesNotTaken > 0 && (
                      <>
                        <div className="text-[10px] uppercase tracking-widest text-text-dimmer mb-3 mt-5">Branch efficiency</div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-surface-2 rounded overflow-hidden">
                              <div
                                className="h-full bg-accent rounded"
                                style={{ width: `${Math.round((stats.branchesTaken / (stats.branchesTaken + stats.branchesNotTaken)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-text-dimmer font-mono w-10 text-right">
                              {Math.round((stats.branchesTaken / (stats.branchesTaken + stats.branchesNotTaken)) * 100)}%
                            </span>
                          </div>
                          <div className="text-[10px] text-text-dimmer">
                            {stats.branchesTaken} taken / {stats.branchesTaken + stats.branchesNotTaken} total
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error bar */}
      {errors.length > 0 && (
        <div className="px-3 py-2 border-t border-error/30 bg-error/5">
          {errors.map((err, i) => (
            <div key={i} className="text-xs text-error font-mono">{err}</div>
          ))}
        </div>
      )}
    </div>
  );
}
