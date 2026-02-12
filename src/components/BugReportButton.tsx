'use client';

import { useState } from 'react';

interface BugReportButtonProps {
  pageType: 'lesson' | 'project';
  pageId: string;
  pageTitle: string;
}

export default function BugReportButton({ pageType, pageId, pageTitle }: BugReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: pageType, pageId, pageTitle, message: message.trim() }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      setMessage('');
      setTimeout(() => { setOpen(false); setStatus('idle'); }, 1500);
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] text-text-dimmer hover:text-text-dim transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Report issue
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setOpen(false); setStatus('idle'); }}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="relative w-80 p-4 bg-surface border border-border rounded-lg shadow-lg space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text">Report an issue</span>
              <button onClick={() => { setOpen(false); setStatus('idle'); }} className="text-text-dimmer hover:text-text-dim transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              autoFocus
              className="w-full bg-bg border border-border rounded px-2.5 py-2 text-xs text-text placeholder:text-text-dimmer focus:outline-none focus:border-accent resize-none"
            />
            <div className="flex items-center justify-between">
              {status === 'sent' && <span className="text-[11px] text-success">Sent! Thanks.</span>}
              {status === 'error' && <span className="text-[11px] text-error">Failed to send.</span>}
              {status !== 'sent' && status !== 'error' && <span />}
              <button
                onClick={handleSubmit}
                disabled={!message.trim() || status === 'sending'}
                className="px-3 py-1.5 text-[11px] font-medium bg-accent text-white rounded transition-colors hover:bg-accent-dim disabled:opacity-40"
              >
                {status === 'sending' ? 'Sending...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
