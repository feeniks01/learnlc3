'use client';

import { useState, useCallback } from 'react';
import type { LessonSection } from '@/lib/lessons';
import SimulatorPanel from './SimulatorPanel';

function MarkdownText({ content }: { content: string }) {
  // Simple markdown-ish rendering
  const html = content
    // Headers
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Tables
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '<tr class="border-b border-border"></tr>';
      return '<tr>' + cells.map(c => `<td class="px-3 py-1 border border-border text-xs">${c}</td>`).join('') + '</tr>';
    })
    // Wrap table rows
    .replace(/((<tr>.*<\/tr>\n?)+)/g, '<table class="border-collapse my-3 text-text-dim">$1</table>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    // Paragraphs (lines not already tagged)
    .split('\n\n')
    .map(block => {
      if (block.startsWith('<')) return block;
      return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
    })
    .join('\n');

  return <div className="lesson-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="font-mono text-[13px] bg-surface border border-border rounded-lg p-4 my-4 overflow-x-auto leading-relaxed">
      <code className="text-text-dim">{code}</code>
    </pre>
  );
}

function InfoBox({ content, type = 'info' }: { content: string; type?: 'info' | 'warning' }) {
  const colors = type === 'warning'
    ? 'border-l-warning bg-warning/5 text-warning'
    : 'border-l-accent bg-accent/5 text-accent';

  return (
    <div className={`border-l-2 ${colors} px-4 py-3 my-4 rounded-r text-[13px] leading-relaxed`}>
      <MarkdownText content={content} />
    </div>
  );
}

function Quiz({ question, options, correct, explanation }: {
  question: string;
  options: string[];
  correct: number;
  explanation?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="my-6 border border-border rounded-lg p-5 bg-surface">
      <div className="text-[11px] uppercase tracking-widest text-text-dimmer mb-3">Quiz</div>
      <p className="text-sm text-text mb-4">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          let style = 'border-border text-text-dim hover:border-text-dimmer';
          if (revealed && i === correct) style = 'border-success text-success bg-success/5';
          else if (revealed && i === selected) style = 'border-error text-error bg-error/5';
          else if (selected === i && !revealed) style = 'border-accent text-accent bg-accent/5';

          return (
            <button
              key={i}
              onClick={() => { if (!revealed) setSelected(i); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] border rounded transition-colors ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && !revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="mt-3 px-4 py-1.5 text-xs font-medium bg-accent text-white rounded"
        >
          Check Answer
        </button>
      )}
      {revealed && explanation && (
        <div className={`mt-3 text-xs leading-relaxed ${selected === correct ? 'text-success' : 'text-error'}`}>
          {selected === correct ? 'Correct! ' : 'Incorrect. '}{explanation}
        </div>
      )}
    </div>
  );
}

function Exercise({ id, prompt, starter, solution, tests }: {
  id: string;
  prompt: string;
  starter: string;
  solution: string;
  tests?: { input?: string; expectedOutput: string; description: string }[];
}) {
  const [showSolution, setShowSolution] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; message: string }[]>([]);

  const handleOutput = useCallback((output: string) => {
    if (!tests) return;
    const results = tests.map(test => {
      const passed = output.trim() === test.expectedOutput.trim();
      return {
        passed,
        message: passed
          ? `${test.description}`
          : `${test.description} — expected "${test.expectedOutput}", got "${output.trim()}"`,
      };
    });
    setTestResults(results);
  }, [tests]);

  return (
    <div className="my-6 border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-surface border-b border-border">
        <div className="text-[11px] uppercase tracking-widest text-accent mb-2">Exercise</div>
        <p className="text-sm text-text-dim leading-relaxed">{prompt}</p>
      </div>

      {/* key forces remount on toggle — user code is preserved in localStorage via storageKey */}
      <SimulatorPanel
        key={showSolution ? 'solution' : 'user'}
        initialCode={showSolution ? solution : starter}
        storageKey={showSolution ? undefined : `exercise_${id}`}
        input={tests?.[0]?.input}
        onOutput={handleOutput}
        compact
      />

      <div className="px-4 py-3 border-t border-border bg-surface flex items-center gap-3">
        <button
          onClick={() => setShowSolution(!showSolution)}
          className="text-xs text-text-dimmer hover:text-text-dim transition-colors"
        >
          {showSolution ? 'Back to My Code' : 'Show Solution'}
        </button>
        {showSolution && (
          <span className="text-[10px] uppercase tracking-widest text-warning">Viewing solution</span>
        )}

        {testResults.length > 0 && (
          <div className="flex-1 flex justify-end">
            {testResults.map((r, i) => (
              <span key={i} className={`text-xs ${r.passed ? 'text-success' : 'text-error'}`}>
                {r.passed ? '✓' : '✗'} {r.message}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LessonContent({ lessonId, sections }: { lessonId: string; sections: LessonSection[] }) {
  return (
    <div className="max-w-3xl mx-auto">
      {sections.map((section, i) => {
        switch (section.type) {
          case 'text':
            return <MarkdownText key={i} content={section.content || ''} />;
          case 'code':
            return <CodeBlock key={i} code={section.code || ''} />;
          case 'info':
            return <InfoBox key={i} content={section.content || ''} type="info" />;
          case 'warning':
            return <InfoBox key={i} content={section.content || ''} type="warning" />;
          case 'quiz':
            return (
              <Quiz
                key={i}
                question={section.question || ''}
                options={section.options || []}
                correct={section.correct || 0}
                explanation={section.explanation}
              />
            );
          case 'exercise':
            return (
              <Exercise
                key={i}
                id={`${lessonId}_${i}`}
                prompt={section.prompt || ''}
                starter={section.starter || ''}
                solution={section.solution || ''}
                tests={section.tests}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
