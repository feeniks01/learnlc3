'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { lessons, categories } from '@/lib/lessons';
import { projects } from '@/lib/projects/index';
import { getCompletedLessons, getProjectPassed } from '@/lib/storage';
import { useState, useEffect } from 'react';

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={`transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
    >
      <path
        d="M10 12L6 8L10 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 5H15M3 9H15M3 13H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SimulatorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7L7 9L5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 11H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [section, setSection] = useState<'lessons' | 'projects'>(
    pathname.startsWith('/projects') ? 'projects' : 'lessons'
  );
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [passedProjects, setPassedProjects] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lc3_sidebar_collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    setCompletedLessons(getCompletedLessons());
    setPassedProjects(new Set(projects.filter(p => getProjectPassed(p.id)).map(p => p.id)));
  }, [pathname]);

  useEffect(() => {
    localStorage.setItem('lc3_sidebar_collapsed', String(collapsed));
  }, [collapsed]);

  if (collapsed) {
    return (
      <aside className="w-12 min-w-12 h-screen border-r border-border bg-surface flex flex-col items-center transition-all duration-200">
        <button
          onClick={() => setCollapsed(false)}
          className="p-3 text-text-dimmer hover:text-text transition-colors"
          title="Expand sidebar"
        >
          <MenuIcon />
        </button>

        <div className="flex-1" />

        <Link
          href="/simulator"
          className={`p-3 border-t border-border transition-colors ${
            pathname === '/simulator' ? 'text-accent' : 'text-text-dimmer hover:text-text'
          }`}
          title="Open Simulator"
        >
          <SimulatorIcon />
        </Link>
      </aside>
    );
  }

  return (
    <aside className="w-64 min-w-64 h-screen border-r border-border bg-surface flex flex-col overflow-hidden transition-all duration-200">
      <div className="flex items-center justify-between border-b border-border">
        <Link href="/" className="block px-5 py-4">
          <h1 className="text-base font-semibold tracking-tight text-text">lc3.fun</h1>
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="px-3 py-4 text-text-dimmer hover:text-text transition-colors"
          title="Collapse sidebar"
        >
          <CollapseIcon collapsed={false} />
        </button>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={() => setSection('lessons')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium tracking-wide uppercase transition-colors ${
            section === 'lessons' ? 'text-accent border-b-2 border-accent' : 'text-text-dimmer hover:text-text-dim'
          }`}
        >
          Lessons
        </button>
        <button
          onClick={() => setSection('projects')}
          className={`flex-1 px-3 py-2.5 text-xs font-medium tracking-wide uppercase transition-colors ${
            section === 'projects' ? 'text-accent border-b-2 border-accent' : 'text-text-dimmer hover:text-text-dim'
          }`}
        >
          Projects
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {section === 'lessons' ? (
          <>
            {categories.map(cat => {
              const catLessons = lessons.filter(l => l.category === cat);
              if (catLessons.length === 0) return null;
              return (
                <div key={cat} className="mb-1">
                  <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-dimmer">
                    {cat}
                  </div>
                  {catLessons.map(lesson => {
                    const isActive = pathname === `/learn/${lesson.id}`;
                    const done = completedLessons.includes(lesson.id);
                    return (
                      <Link
                        key={lesson.id}
                        href={`/learn/${lesson.id}`}
                        className={`flex items-center gap-2 px-4 py-1.5 text-[13px] transition-colors ${
                          isActive
                            ? 'text-accent bg-accent/5 border-r-2 border-accent'
                            : 'text-text-dim hover:text-text hover:bg-surface-2'
                        }`}
                      >
                        {done && <span className="text-success text-[10px]">&#10003;</span>}
                        <span>{lesson.title}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </>
        ) : (
          <div className="py-1">
            {projects.map(project => {
              const isActive = pathname === `/projects/${project.id}`;
              const diffColor = {
                Beginner: 'text-success',
                Intermediate: 'text-warning',
                Advanced: 'text-error',
              }[project.difficulty];
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={`block px-4 py-2 transition-colors ${
                    isActive
                      ? 'text-accent bg-accent/5 border-r-2 border-accent'
                      : 'text-text-dim hover:text-text hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[13px]">
                    {passedProjects.has(project.id) && <span className="text-success text-[10px]">&#10003;</span>}
                    <span>{project.title}</span>
                  </div>
                  <div className={`text-[10px] ${diffColor}`}>{project.difficulty}</div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <Link
        href="/simulator"
        className={`block px-4 py-3 text-[13px] border-t border-border transition-colors ${
          pathname === '/simulator'
            ? 'text-accent bg-accent/5'
            : 'text-text-dim hover:text-text hover:bg-surface-2'
        }`}
      >
        Open Simulator
      </Link>
    </aside>
  );
}
