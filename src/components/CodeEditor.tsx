'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useAI } from './AIContext';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  activeLine?: number | null;
  showLineNumbers?: boolean;
  onScrollTop?: (scrollTop: number) => void;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type TokenType = 'comment' | 'string' | 'directive' | 'register' | 'trap' | 'keyword' | 'number' | 'text';

interface Token { type: TokenType; value: string; }

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];

  // Split off comment first (everything from first ; onward)
  let code = line;
  let comment = '';
  const commentIdx = line.indexOf(';');
  if (commentIdx !== -1) {
    code = line.substring(0, commentIdx);
    comment = line.substring(commentIdx);
  }

  // Tokenize the code portion with a single regex that matches all token types in priority order
  const tokenPattern = /("(?:[^"\\]|\\.)*")|(\.(ORIG|END|FILL|BLKW|STRINGZ))\b|\b(R[0-7])\b|\b(GETC|OUT|PUTS|IN|PUTSP|HALT|TRAP)\b|\b(ADD|AND|NOT|BR[nzp]{0,3}|LD[IR]?|LEA|ST[IR]?|JMP|JSRR?|RET|RTI|NOP)\b|(#-?\d+\b|x[0-9a-fA-F]+\b|b[01]+\b)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenPattern.exec(code)) !== null) {
    // Push any plain text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: code.substring(lastIndex, match.index) });
    }

    if (match[1] !== undefined) tokens.push({ type: 'string', value: match[0] });
    else if (match[2] !== undefined) tokens.push({ type: 'directive', value: match[0] });
    else if (match[4] !== undefined) tokens.push({ type: 'register', value: match[0] });
    else if (match[5] !== undefined) tokens.push({ type: 'trap', value: match[0] });
    else if (match[6] !== undefined) tokens.push({ type: 'keyword', value: match[0] });
    else if (match[7] !== undefined) tokens.push({ type: 'number', value: match[0] });
    else tokens.push({ type: 'text', value: match[0] });

    lastIndex = tokenPattern.lastIndex;
  }

  // Remaining plain text
  if (lastIndex < code.length) {
    tokens.push({ type: 'text', value: code.substring(lastIndex) });
  }

  // Append comment
  if (comment) {
    tokens.push({ type: 'comment', value: comment });
  }

  return tokens;
}

const CLASS_MAP: Record<TokenType, string> = {
  comment: 'syntax-comment',
  string: 'syntax-string',
  directive: 'syntax-directive',
  register: 'syntax-register',
  trap: 'syntax-trap',
  keyword: 'syntax-keyword',
  number: 'syntax-number',
  text: '',
};

function highlightLine(line: string): string {
  if (line.length === 0) return ' ';
  const tokens = tokenizeLine(line);
  return tokens.map(t => {
    const escaped = escapeHtml(t.value);
    const cls = CLASS_MAP[t.type];
    return cls ? `<span class="${cls}">${escaped}</span>` : escaped;
  }).join('');
}

interface ContextMenuState {
  x: number;
  y: number;
  selectedText: string;
}

export default function CodeEditor({ value, onChange, readOnly = false, height = '100%', activeLine, showLineNumbers = true, onScrollTop }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const ai = useAI();

  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
      }
      onScrollTop?.(textareaRef.current.scrollTop);
    }
  }, [onScrollTop]);

  useEffect(() => {
    setLineCount(value.split('\n').length);
  }, [value]);

  // Close context menu on click anywhere or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const ta = textareaRef.current;
    if (!ta || !ai) return;

    const hasSelection = ta.selectionStart !== ta.selectionEnd;
    if (!hasSelection) return; // only show custom menu when text is selected

    e.preventDefault();

    const selectedText = ta.value.substring(ta.selectionStart, ta.selectionEnd);
    if (!selectedText.trim()) return;

    // Position relative to the container
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    setContextMenu({
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
      selectedText,
    });
  }, [ai]);

  const handleAskAI = useCallback(() => {
    if (contextMenu && ai) {
      ai.openWithCode(contextMenu.selectedText);
      setContextMenu(null);
    }
  }, [contextMenu, ai]);

  // Build a single string of newline-separated highlighted lines — matches textarea text flow exactly
  const highlighted = value.split('\n').map(line => highlightLine(line)).join('\n');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.substring(0, start) + '    ' + value.substring(end);
      onChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  };

  return (
    <div ref={containerRef} className="relative flex font-mono text-[13px] leading-[1.6] pt-2" style={{ height }}>
      {/* Line numbers */}
      {showLineNumbers && (
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 w-8 overflow-hidden select-none text-text-dimmer bg-surface border-r border-border pt-2"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className={`flex items-center justify-center text-[11px] ${activeLine === i + 1 ? 'text-accent' : ''}`}
              style={{ height: '1.6em' }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Editor area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Right-click context menu */}
        {contextMenu && (
          <div
            className="absolute z-20 ai-glass-panel py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              onClick={handleAskAI}
              className="w-full px-3 py-1.5 text-left text-[12px] text-text hover:bg-white/[0.08]
                         transition-colors flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Ask AI
            </button>
          </div>
        )}

        {/* Syntax highlight layer — uses <pre> so newlines match textarea exactly */}
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="absolute inset-0 m-0 overflow-hidden pointer-events-none pt-2"
          style={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            lineHeight: 'inherit',
            whiteSpace: 'pre',
            wordWrap: 'normal',
            overflowWrap: 'normal',
            padding: '0.5rem 1em 0 1rem',
            border: 'none',
            background: 'transparent',
          }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />

        {/* Textarea layer — transparent text, handles input/selection/cursor */}
        <textarea
          ref={textareaRef}
          className="code-editor absolute inset-0 w-full h-full"
          style={{ padding: '0.5rem 1em 0 1rem' }}
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={syncScroll}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          readOnly={readOnly}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
