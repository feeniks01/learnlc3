'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { LC3VM, assemble } from '@/lib/lc3';
import { getSavedCode, saveCode, getSavedPrograms, saveProgram, deleteProgram, type SavedProgram } from '@/lib/storage';
import CodeEditor from './CodeEditor';

interface SimulatorPanelProps {
  initialCode?: string;
  storageKey?: string;
  input?: string;
  onOutput?: (output: string) => void;
  compact?: boolean;
  /** Use project-style layout (line numbers gutter, toolbar styling) */
  projectStyle?: boolean;
}

interface EditorFile {
  name: string;
  content: string;
}

const DEFAULT_CODE = `.ORIG x3000
; Write your LC-3 code here

HALT
.END`;

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

/** Try to parse a saved string as a files array; fall back to single file. */
function parseFiles(raw: string | null, fallback: string): EditorFile[] {
  if (raw === null) return [{ name: 'main.asm', content: fallback }];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name && typeof parsed[0].content === 'string') {
      return parsed as EditorFile[];
    }
  } catch {
    // not JSON — treat as raw code string
  }
  return [{ name: 'main.asm', content: raw }];
}

export default function SimulatorPanel({ initialCode, storageKey, input, onOutput, compact = false, projectStyle = false }: SimulatorPanelProps) {
  const [files, setFiles] = useState<EditorFile[]>(() => {
    if (storageKey) {
      const saved = getSavedCode(storageKey);
      if (saved !== null) return parseFiles(saved, '');
    }
    return [{ name: 'main.asm', content: initialCode || DEFAULT_CODE }];
  });
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const tabInputRef = useRef<HTMLInputElement>(null);

  // Derived code for active file
  const code = files[activeFileIndex]?.content ?? '';
  const setCode = useCallback((newCode: string) => {
    setFiles(prev => prev.map((f, i) => i === activeFileIndex ? { ...f, content: newCode } : f));
  }, [activeFileIndex]);

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
  const activeSourceFileRef = useRef(0);
  const originRef = useRef(0x3000);
  const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>([]);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [saveName, setSaveName] = useState('');
  const saveMenuRef = useRef<HTMLDivElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  const lineCount = code.split('\n').length;

  const handleScrollTop = useCallback((scrollTop: number) => {
    if (lineNumRef.current) {
      lineNumRef.current.scrollTop = scrollTop;
    }
  }, []);

  // ── File tab management ──────────────────────────

  const addFile = useCallback(() => {
    const existingNames = new Set(files.map(f => f.name));
    let idx = files.length + 1;
    let name = `file${idx}.asm`;
    while (existingNames.has(name)) {
      idx++;
      name = `file${idx}.asm`;
    }
    setFiles(prev => [...prev, { name, content: `.ORIG x${(0x3000 + prev.length * 0x1000).toString(16).toUpperCase()}\n\n.END` }]);
    setActiveFileIndex(files.length);
  }, [files]);

  const closeFile = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;
    setFiles(prev => prev.filter((_, i) => i !== index));
    setActiveFileIndex(prev => {
      if (prev >= index && prev > 0) return prev - 1;
      return prev;
    });
  }, [files.length]);

  const startRenaming = useCallback((index: number) => {
    setEditingTabIndex(index);
    setEditingTabName(files[index].name);
    setTimeout(() => tabInputRef.current?.select(), 0);
  }, [files]);

  const finishRenaming = useCallback(() => {
    if (editingTabIndex === null) return;
    const trimmed = editingTabName.trim();
    if (trimmed) {
      setFiles(prev => prev.map((f, i) => i === editingTabIndex ? { ...f, name: trimmed } : f));
    }
    setEditingTabIndex(null);
  }, [editingTabIndex, editingTabName]);

  // ── Load saved programs list ─────────────────────
  useEffect(() => {
    setSavedPrograms(getSavedPrograms());
  }, []);

  // Close save menu on outside click
  useEffect(() => {
    if (!showSaveMenu) return;
    const handler = (e: MouseEvent) => {
      if (saveMenuRef.current && !saveMenuRef.current.contains(e.target as Node)) {
        setShowSaveMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSaveMenu]);

  const handleSaveProgram = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    // Save the full files array as JSON
    saveProgram(name, JSON.stringify(files));
    setSavedPrograms(getSavedPrograms());
    setSaveName('');
    setShowSaveMenu(false);
  }, [saveName, files]);

  const handleLoadProgram = useCallback((program: SavedProgram) => {
    const loaded = parseFiles(program.code, DEFAULT_CODE);
    setFiles(loaded);
    setActiveFileIndex(0);
    setShowSaveMenu(false);
    setAssembled(false);
    setErrors([]);
    setActiveLine(null);
  }, []);

  const handleDeleteProgram = useCallback((name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteProgram(name);
    setSavedPrograms(getSavedPrograms());
  }, []);

  // Auto-save files with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!storageKey) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveCode(storageKey, JSON.stringify(files)), 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [files, storageKey]);

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

    // Assemble all files, collect results
    const allErrors: string[] = [];
    const results: { origin: number; machineCode: number[]; sourceMap: Map<number, number>; fileIndex: number }[] = [];
    let totalCodeSize = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = assemble(file.content);

      if (result.errors.length > 0) {
        const prefix = files.length > 1 ? `${file.name} — ` : '';
        allErrors.push(...result.errors.map(e => `${prefix}Line ${e.line}: ${e.message}`));
      } else {
        results.push({
          origin: result.origin,
          machineCode: result.machineCode,
          sourceMap: result.sourceMap,
          fileIndex: i,
        });
        totalCodeSize += result.machineCode.length;
      }
    }

    if (allErrors.length > 0) {
      setErrors(allErrors);
      setAssembled(false);
      return false;
    }

    // Load all assembled files into VM
    // First, find the primary file (origin x3000) to use vm.load (sets PC)
    const primaryIdx = results.findIndex(r => r.origin === 0x3000);

    if (primaryIdx >= 0) {
      const primary = results[primaryIdx];
      vm.load(primary.origin, primary.machineCode);
    } else {
      // No x3000 file — just set PC to x3000
      vm.pc = 0x3000;
    }

    // Load all other files with loadAt (doesn't change PC)
    for (let i = 0; i < results.length; i++) {
      if (i === primaryIdx) continue;
      vm.loadAt(results[i].origin, results[i].machineCode);
    }

    vm.inputBuffer = consoleInput;

    // Merge source maps — only use the active file's map for line highlighting
    // Store just the active file's sourceMap for stepping
    const activeResult = results.find(r => r.fileIndex === activeFileIndex);
    sourceMapRef.current = activeResult?.sourceMap ?? results[0]?.sourceMap ?? new Map();
    activeSourceFileRef.current = activeResult?.fileIndex ?? results[0]?.fileIndex ?? 0;

    originRef.current = primaryIdx >= 0 ? results[primaryIdx].origin : (results[0]?.origin ?? 0x3000);
    setMemoryStart(originRef.current);
    setCodeSize(totalCodeSize);
    setAssembled(true);
    setHalted(false);
    updateState();
    return true;
  }, [files, activeFileIndex, consoleInput, vm, updateState]);

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

  // ── File tab bar ─────────────────────────────────

  const fileTabBar = (
    <div className="flex items-center bg-surface border-b border-border flex-shrink-0 overflow-x-auto">
      {files.map((file, i) => (
        <div
          key={i}
          onClick={() => setActiveFileIndex(i)}
          onDoubleClick={() => startRenaming(i)}
          className={`group flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer border-r border-border transition-colors select-none ${
            i === activeFileIndex
              ? 'bg-bg text-text'
              : 'text-text-dimmer hover:text-text-dim hover:bg-surface-2'
          }`}
        >
          {editingTabIndex === i ? (
            <input
              ref={tabInputRef}
              className="bg-transparent border-b border-accent text-xs text-text outline-none w-20 font-mono"
              value={editingTabName}
              onChange={e => setEditingTabName(e.target.value)}
              onBlur={finishRenaming}
              onKeyDown={e => {
                if (e.key === 'Enter') finishRenaming();
                if (e.key === 'Escape') setEditingTabIndex(null);
              }}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className="font-mono">{file.name}</span>
          )}
          {files.length > 1 && (
            <button
              onClick={(e) => closeFile(i, e)}
              className="ml-0.5 p-0.5 text-text-dimmer hover:text-error opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2L8 8M8 2L2 8" />
              </svg>
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addFile}
        className="px-2.5 py-1.5 text-text-dimmer hover:text-text transition-colors"
        title="Add file"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M6 2v8M2 6h8" />
        </svg>
      </button>
    </div>
  );

  const rightPanel = (
    <div className="w-72 min-w-72 flex flex-col overflow-hidden">
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
  );

  const toolbarButtons = (
    <>
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

      <div className="w-px h-5 bg-border mx-1" />

      {/* Save/Load dropdown */}
      <div className="relative" ref={saveMenuRef}>
        <button
          onClick={() => setShowSaveMenu(!showSaveMenu)}
          className="px-3 py-1 text-xs font-medium bg-surface-2 text-text-dim hover:text-text border border-border rounded transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 13H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7l3 3v6a1 1 0 0 1-1 1z" />
            <path d="M5 3v4h4" />
            <path d="M10 13V9H5" />
          </svg>
          Programs
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform ${showSaveMenu ? 'rotate-180' : ''}`}>
            <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showSaveMenu && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-surface border border-border rounded shadow-xl z-30">
            {/* Save input */}
            <div className="p-2 border-b border-border">
              <div className="text-[10px] uppercase tracking-widest text-text-dimmer mb-1.5">Save current program</div>
              <div className="flex gap-1">
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-xs bg-surface-2 border border-border rounded text-text placeholder:text-text-dimmer"
                  placeholder="Program name..."
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveProgram()}
                  autoFocus
                />
                <button
                  onClick={handleSaveProgram}
                  disabled={!saveName.trim()}
                  className="px-2.5 py-1 text-xs font-medium bg-accent text-white rounded transition-colors disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Saved programs list */}
            <div className="max-h-48 overflow-y-auto">
              {savedPrograms.length === 0 ? (
                <div className="px-3 py-3 text-xs text-text-dimmer text-center">No saved programs yet</div>
              ) : (
                savedPrograms.map(p => (
                  <button
                    key={p.name}
                    onClick={() => handleLoadProgram(p)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-surface-2 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-text truncate">{p.name}</div>
                      <div className="text-[10px] text-text-dimmer">
                        {new Date(p.savedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProgram(p.name, e)}
                      className="ml-2 p-1 text-text-dimmer hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete program"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M2 2L8 8M8 2L2 8" />
                      </svg>
                    </button>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className={`flex flex-col ${h} bg-bg`}>
      {projectStyle ? (
        /* Project-style layout: line numbers gutter + toolbar + editor + right panel */
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Line numbers gutter — matches project page */}
          <div className="flex-shrink-0 w-8 bg-surface border-r border-border flex flex-col">
            <div className="px-3 py-1.5 border-b border-border flex-shrink-0">
              <div className="py-1 text-[11px] leading-normal invisible">&nbsp;</div>
            </div>
            {/* Spacer for file tab bar */}
            {files.length > 1 && <div className="border-b border-border" style={{ height: '30px' }} />}
            <div
              ref={lineNumRef}
              className="flex-1 overflow-hidden font-mono text-[13px] leading-[1.6] select-none text-text-dimmer overflow-y-auto"
              style={{ paddingTop: '1rem' }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center ${activeLine === i + 1 ? 'text-accent' : ''}`}
                  style={{ height: '1.6em' }}
                >
                  <span className="text-[11px]">{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Toolbar + Editor + Right panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border flex-shrink-0">
              <div className="flex items-center gap-1.5">
                {toolbarButtons}
              </div>
              {assembled && (
                <span className="text-[11px] text-text-dimmer">
                  {instructionCount} instructions
                  {halted && ' — halted'}
                  {waitingForInput && ' — waiting for input'}
                </span>
              )}
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0">
              <div className="flex-1 flex flex-col overflow-hidden border-r border-border min-w-0">
                {files.length > 1 && fileTabBar}
                <div className="flex-1 overflow-hidden">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    activeLine={activeLine}
                    showLineNumbers={false}
                    onScrollTop={handleScrollTop}
                  />
                </div>
              </div>

              {rightPanel}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface">
            {toolbarButtons}
            <div className="flex-1" />
            {assembled && (
              <span className="text-[11px] text-text-dimmer">
                {instructionCount} instructions
                {halted && ' — halted'}
                {waitingForInput && ' — waiting for input'}
              </span>
            )}
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
              {files.length > 1 && fileTabBar}
              <div className="flex-1 overflow-hidden">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  activeLine={activeLine}
                />
              </div>
            </div>

            {rightPanel}
          </div>
        </>
      )}

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
