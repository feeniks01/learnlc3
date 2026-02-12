'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { lessons, categories } from '@/lib/lessons';
import { projects } from '@/lib/projects/index';

export default function Home() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-16">
          {/* Hero */}
          <div className="mb-16">
            <h1 className="text-4xl font-bold text-text tracking-tight mb-3">lc3.fun</h1>
            <p className="text-lg text-text-dim max-w-xl leading-relaxed">
              Master assembly programming from the ground up with interactive lessons, a built-in simulator, and hands-on projects.
            </p>
            <div className="flex gap-3 mt-6">
              <Link
                href={`/learn/${lessons[0].id}`}
                className="px-5 py-2.5 text-sm font-medium bg-accent text-white rounded transition-colors hover:bg-accent-dim"
              >
                Start Learning
              </Link>
              <Link
                href="/simulator"
                className="px-5 py-2.5 text-sm font-medium bg-surface-2 text-text-dim border border-border rounded transition-colors hover:text-text"
              >
                Open Simulator
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-16">
            <div className="border border-border rounded-lg p-5 bg-surface">
              <div className="text-2xl font-bold text-text">{lessons.length}</div>
              <div className="text-sm text-text-dim mt-1">Interactive Lessons</div>
            </div>
            <div className="border border-border rounded-lg p-5 bg-surface">
              <div className="text-2xl font-bold text-text">{projects.length}</div>
              <div className="text-sm text-text-dim mt-1">Coding Projects</div>
            </div>
            <div className="border border-border rounded-lg p-5 bg-surface">
              <div className="text-2xl font-bold text-text">15</div>
              <div className="text-sm text-text-dim mt-1">LC-3 Instructions</div>
            </div>
          </div>

          {/* Curriculum */}
          <div className="mb-16">
            <h2 className="text-lg font-semibold text-text mb-6">Curriculum</h2>
            <div className="space-y-6">
              {categories.map(cat => {
                const catLessons = lessons.filter(l => l.category === cat);
                if (catLessons.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="text-[11px] uppercase tracking-widest text-text-dimmer mb-2">{cat}</div>
                    <div className="grid gap-2">
                      {catLessons.map((lesson, i) => (
                        <Link
                          key={lesson.id}
                          href={`/learn/${lesson.id}`}
                          className="flex items-center gap-4 px-4 py-3 border border-border rounded-lg bg-surface hover:border-text-dimmer transition-colors group"
                        >
                          <span className="w-6 h-6 flex items-center justify-center rounded text-[11px] font-mono text-text-dimmer bg-surface-2">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm text-text group-hover:text-accent transition-colors">{lesson.title}</div>
                            <div className="text-xs text-text-dimmer mt-0.5">{lesson.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Projects */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-6">Projects</h2>
            <div className="grid grid-cols-2 gap-3">
              {projects.map(project => {
                const diffColor = {
                  Beginner: 'text-success',
                  Intermediate: 'text-warning',
                  Advanced: 'text-error',
                }[project.difficulty];
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="px-4 py-3 border border-border rounded-lg bg-surface hover:border-text-dimmer transition-colors group"
                  >
                    <div className="text-sm text-text group-hover:text-accent transition-colors">{project.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] ${diffColor}`}>{project.difficulty}</span>
                      <span className="text-[10px] text-text-dimmer">—</span>
                      <span className="text-xs text-text-dimmer">{project.description}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
