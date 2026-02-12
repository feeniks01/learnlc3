'use client';

import { useState, useRef, useEffect } from 'react';
import { useAI } from './AIContext';

function MarkdownContent({ content }: { content: string }) {
  // Split on code blocks (```...```)
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
          return (
            <pre key={i} className="font-mono text-[12px] bg-black/30 rounded p-2 my-2 overflow-x-auto leading-relaxed whitespace-pre">
              {code}
            </pre>
          );
        }
        // Inline code and bold
        const html = part
          .replace(/`([^`]+)`/g, '<code class="font-mono text-[12px] bg-white/[0.06] px-1 rounded text-accent">$1</code>')
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text font-semibold">$1</strong>')
          .replace(/\n/g, '<br/>');
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
    </>
  );
}

export default function AIAssistant() {
  const ai = useAI();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ai?.messages]);

  useEffect(() => {
    if (ai?.isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [ai?.isOpen]);

  if (!ai) return null;

  const { isOpen, selectedCode, messages, isLoading, open, close, sendMessage, clearChat } = ai;

  if (!isOpen) {
    return (
      <button
        onClick={open}
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full
                   bg-accent text-white shadow-lg hover:bg-accent-dim
                   transition-all flex items-center justify-center
                   hover:scale-105 active:scale-95"
        title="Ask AI about LC-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <circle cx="9" cy="10" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="10" r="0.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="10" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      </button>
    );
  }

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput('');
    shouldAutoScroll.current = true;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') close();
  };

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col ai-glass-panel"
      style={{ width: 420, maxHeight: 520 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-medium text-text">LC-3 Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-[11px] text-text-dimmer hover:text-text-dim transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={close}
            className="text-text-dimmer hover:text-text text-lg leading-none transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-white/[0.06]"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Code context */}
      {selectedCode && (
        <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="text-[10px] uppercase tracking-widest text-text-dimmer mb-1">Selected Code</div>
          <pre className="text-[11px] font-mono text-text-dim max-h-20 overflow-hidden leading-relaxed whitespace-pre">
            {selectedCode.split('\n').slice(0, 5).join('\n')}
            {selectedCode.split('\n').length > 5 ? '\n...' : ''}
          </pre>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
        style={{ maxHeight: 320 }}
        onScroll={(e) => {
          const el = e.currentTarget;
          shouldAutoScroll.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
        }}
      >
        {messages.length === 0 ? (
          <div className="text-xs text-text-dimmer text-center py-8 leading-relaxed">
            Ask about LC-3 instructions, debug your code, or get help with assignments.
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-lg text-[13px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent/20 text-text'
                  : 'bg-white/[0.04] text-text-dim'
              }`}>
                {msg.role === 'assistant' ? (
                  <>
                    {msg.content ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      isLoading && (
                        <span className="inline-flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-text-dimmer animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-text-dimmer animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-text-dimmer animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )
                    )}
                  </>
                ) : msg.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about LC-3..."
            rows={1}
            className="flex-1 px-3 py-2 text-[13px] bg-white/[0.04] border border-white/[0.08] rounded-lg
                       text-text placeholder-text-dimmer resize-none focus:outline-none focus:border-accent/50
                       transition-colors"
            style={{ maxHeight: 72 }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 text-xs font-medium bg-accent text-white rounded-lg
                       disabled:opacity-30 transition-all hover:bg-accent-dim
                       active:scale-95"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
