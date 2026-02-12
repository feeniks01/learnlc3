'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import CodeEditor from '@/components/CodeEditor';
import Autograder from '@/components/Autograder';
import type { AutograderHandle } from '@/components/Autograder';
import { getProjectById } from '@/lib/projects/index';
import { getSavedCode, saveCode } from '@/lib/storage';
import BugReportButton from '@/components/BugReportButton';

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  const project = getProjectById(id);
  const [code, setCode] = useState(() => {
    const saved = getSavedCode(`project_${id}`);
    return saved !== null ? saved : (project?.starter || '');
  });
  const [showHints, setShowHints] = useState(false);
  const autograderRef = useRef<AutograderHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);

  // Auto-save code
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCode(`project_${id}`, code), 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [code, id]);

  // 50-minute timer for palindrome project
  const hasTimer = id === 'palindrome';
  const [timerSeconds, setTimerSeconds] = useState(50 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!hasTimer || !timerRunning || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) { setTimerRunning(false); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [hasTimer, timerRunning, timerSeconds]);

  const timerDisplay = useMemo(() => {
    const m = Math.floor(timerSeconds / 60);
    const s = timerSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timerSeconds]);

  const lineCount = code.split('\n').length;

  const handleScrollTop = useCallback((scrollTop: number) => {
    if (lineNumRef.current) {
      lineNumRef.current.scrollTop = scrollTop;
    }
  }, []);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setCode(text);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-imported
    e.target.value = '';
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.asm`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, id]);

  if (!project) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-text-dimmer">Project not found.</div>
        </main>
      </div>
    );
  }

  const diffColor = {
    Beginner: 'text-success',
    Intermediate: 'text-warning',
    Advanced: 'text-error',
  }[project.difficulty];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Description */}
        <div className="w-96 min-w-80 overflow-y-auto p-6">
          <div className={`text-[11px] uppercase tracking-widest ${diffColor} mb-1`}>{project.difficulty}</div>
          <h1 className="text-xl font-semibold text-text mb-2">{project.title}</h1>
          <p className="text-sm text-text-dim mb-4">{project.description}</p>

          <div className="lesson-content text-sm">
            {(() => {
              const blocks: Array<{ type: 'paragraph' | 'code' | 'table'; content: string }> = [];
              const lines = project.details.split('\n');
              let i = 0;
              let para = '';

              const flush = () => {
                if (para.trim()) blocks.push({ type: 'paragraph', content: para.trim() });
                para = '';
              };

              while (i < lines.length) {
                const line = lines[i];
                if (line.trim().startsWith('```')) {
                  flush();
                  i++;
                  let code = '';
                  while (i < lines.length && !lines[i].trim().startsWith('```')) {
                    code += (code ? '\n' : '') + lines[i];
                    i++;
                  }
                  blocks.push({ type: 'code', content: code });
                  i++;
                  continue;
                }
                if (line.trim().startsWith('|')) {
                  flush();
                  const tableLines: string[] = [];
                  while (i < lines.length && lines[i].trim().startsWith('|')) {
                    tableLines.push(lines[i]);
                    i++;
                  }
                  blocks.push({ type: 'table', content: tableLines.join('\n') });
                  continue;
                }
                if (line.trim() === '') {
                  flush();
                  i++;
                  continue;
                }
                para += (para ? '\n' : '') + line;
                i++;
              }
              flush();

              return blocks.map((block, idx) => {
                if (block.type === 'code') {
                  return <pre key={idx} className="font-mono text-xs bg-surface border border-border rounded p-3 my-3">{block.content}</pre>;
                }
                if (block.type === 'table') {
                  const rows = block.content.split('\n').filter(r => !/^\|[\s-:|]+\|$/.test(r));
                  return (
                    <table key={idx} className="text-xs font-mono my-3 border-collapse">
                      <tbody>
                        {rows.map((row, ri) => {
                          const cells = row.split('|').slice(1, -1).map(c => c.trim());
                          const Tag = ri === 0 ? 'th' : 'td';
                          return (
                            <tr key={ri}>
                              {cells.map((cell, ci) => (
                                <Tag key={ci} className={`px-3 py-1 border border-border text-text-dim ${ri === 0 ? 'text-text font-semibold bg-surface' : ''}`}>{cell}</Tag>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                }
                return <p key={idx} className="text-text-dim leading-relaxed mb-3" dangerouslySetInnerHTML={{
                  __html: block.content
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+)`/g, '<code>$1</code>')
                    .replace(/^- (.+)$/gm, '• $1<br/>')
                    .replace(/\n/g, '<br/>')
                }} />;
              });
            })()}
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowHints(!showHints)}
              className="text-xs text-text-dimmer hover:text-text-dim transition-colors"
            >
              {showHints ? 'Hide Hints' : 'Show Hints'}
            </button>
            {showHints && (
              <ol className="mt-2 space-y-1">
                {project.hints.map((hint, i) => (
                  <li key={i} className="text-xs text-text-dim leading-relaxed">
                    <span className="text-text-dimmer mr-1">{i + 1}.</span> {hint}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-4">
            <BugReportButton pageType="project" pageId={id} pageTitle={project.title} />
          </div>
        </div>

        {/* Center: Full-height line numbers gutter */}
        <div className="flex-shrink-0 w-8 bg-surface border-l border-r border-border flex flex-col">
          {/* Spacer matching toolbar height — uses same padding/content sizing */}
          <div className="px-3 py-1.5 border-b border-border flex-shrink-0">
            <div className="py-1 text-[11px] leading-normal invisible">&nbsp;</div>
          </div>
          {/* Scrollable line numbers */}
          <div
            ref={lineNumRef}
            className="flex-1 overflow-hidden font-mono text-[13px] leading-[1.6] select-none text-text-dimmer"
            style={{ paddingTop: '1rem' }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{ height: '1.6em' }}
              >
                <span className="text-[11px]">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Toolbar + Editor + Autograder */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".asm"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={handleImport}
                className="px-2.5 py-1 text-[11px] text-text-dimmer hover:text-text-dim bg-transparent hover:bg-white/[0.05] rounded transition-colors flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Import
              </button>
              <button
                onClick={handleExport}
                className="px-2.5 py-1 text-[11px] text-text-dimmer hover:text-text-dim bg-transparent hover:bg-white/[0.05] rounded transition-colors flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Export
              </button>
            </div>
            <div className="flex items-center gap-2">
              {hasTimer && (
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono text-[11px] font-medium tabular-nums ${timerSeconds <= 300 ? 'text-error' : 'text-text-dim'}`}>
                    {timerDisplay}
                  </span>
                  <button
                    onClick={() => setTimerRunning(r => !r)}
                    className="px-1.5 py-0.5 text-[10px] text-text-dimmer hover:text-text-dim bg-transparent hover:bg-white/[0.05] border border-border rounded transition-colors"
                  >
                    {timerRunning ? 'Pause' : timerSeconds < 50 * 60 ? 'Resume' : 'Start'}
                  </button>
                  {timerSeconds < 50 * 60 && !timerRunning && (
                    <button
                      onClick={() => { setTimerSeconds(50 * 60); setTimerRunning(false); }}
                      className="px-1.5 py-0.5 text-[10px] text-text-dimmer hover:text-text-dim bg-transparent hover:bg-white/[0.05] border border-border rounded transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
              <button
                onClick={() => autograderRef.current?.runTests()}
                disabled={autograderRef.current?.running}
                className="px-3 py-1 text-[11px] font-medium bg-accent text-white rounded transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
                Run Tests
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor value={code} onChange={setCode} showLineNumbers={false} onScrollTop={handleScrollTop} />
          </div>

          {/* Autograder results */}
          <Autograder ref={autograderRef} projectId={id} code={code} tests={project.tests} showButton={false} />
        </div>
      </main>
    </div>
  );
}
