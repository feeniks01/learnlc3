'use client';

import { useState } from 'react';

interface Report {
  id: string;
  type: 'lesson' | 'project';
  pageId: string;
  pageTitle: string;
  message: string;
  timestamp: string;
}

export default function AdminReportsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bug-reports', {
        headers: { 'x-admin-password': password },
      });
      if (res.status === 401) {
        setError('Wrong password');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReports(data);
      setAuthed(true);
    } catch {
      setError('Failed to load reports');
    }
    setLoading(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-72 space-y-3">
          <h1 className="text-sm font-medium text-text">Admin Reports</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-dimmer focus:outline-none focus:border-accent"
          />
          {error && <p className="text-[11px] text-error">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !password}
            className="w-full px-3 py-2 text-sm font-medium bg-accent text-white rounded transition-colors hover:bg-accent-dim disabled:opacity-40"
          >
            {loading ? 'Loading...' : 'View Reports'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-lg font-semibold text-text mb-4">Bug Reports ({reports.length})</h1>
        {reports.length === 0 ? (
          <p className="text-sm text-text-dimmer">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="p-4 bg-surface border border-border rounded">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[11px] uppercase tracking-widest ${r.type === 'lesson' ? 'text-accent' : 'text-warning'}`}>
                    {r.type}
                  </span>
                  <span className="text-xs text-text-dim">{r.pageTitle}</span>
                  <span className="text-[11px] text-text-dimmer ml-auto">
                    {new Date(r.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-text">{r.message}</p>
                <p className="text-[11px] text-text-dimmer mt-1">/{r.type === 'lesson' ? 'learn' : 'projects'}/{r.pageId}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
