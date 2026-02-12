'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import LessonContent from '@/components/LessonContent';
import { getLessonById, getNextLesson, getPrevLesson } from '@/lib/lessons';
import { isLessonComplete, markLessonComplete } from '@/lib/storage';
import BugReportButton from '@/components/BugReportButton';

export default function LessonPage() {
  const params = useParams();
  const id = params.id as string;
  const lesson = getLessonById(id);
  const next = getNextLesson(id);
  const prev = getPrevLesson(id);

  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isLessonComplete(id));
  }, [id]);

  if (!lesson) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-text-dimmer">Lesson not found.</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          <div className="mb-1 text-[11px] uppercase tracking-widest text-accent">{lesson.category}</div>
          <h1 className="text-2xl font-semibold text-text mb-2">{lesson.title}</h1>
          <p className="text-sm text-text-dim mb-8">{lesson.description}</p>

          <LessonContent lessonId={lesson.id} sections={lesson.sections} />

          {/* Mark complete */}
          <div className="mt-10 flex justify-center">
            {completed ? (
              <span className="text-sm text-success">Lesson completed</span>
            ) : (
              <button
                onClick={() => { markLessonComplete(id); setCompleted(true); }}
                className="px-5 py-2 text-sm font-medium bg-accent text-white rounded transition-colors hover:bg-accent-dim"
              >
                Mark as Complete
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <BugReportButton pageType="lesson" pageId={id} pageTitle={lesson.title} />
          </div>
          <div className="flex items-center justify-between mt-4">
            {prev ? (
              <Link href={`/learn/${prev.id}`} className="text-sm text-text-dim hover:text-accent transition-colors">
                &larr; {prev.title}
              </Link>
            ) : <div />}
            {next ? (
              <Link href={`/learn/${next.id}`} className="text-sm text-accent hover:text-text transition-colors">
                {next.title} &rarr;
              </Link>
            ) : <div />}
          </div>
        </div>
      </main>
    </div>
  );
}
