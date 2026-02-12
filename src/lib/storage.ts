const PREFIX = 'lc3_';

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ── Lesson progress ────────────────────────────────

export function getCompletedLessons(): string[] {
  return get<string[]>('completed_lessons', []);
}

export function markLessonComplete(id: string): void {
  const completed = getCompletedLessons();
  if (!completed.includes(id)) {
    completed.push(id);
    set('completed_lessons', completed);
  }
}

export function isLessonComplete(id: string): boolean {
  return getCompletedLessons().includes(id);
}

// ── Exercise / project code ────────────────────────

export function getSavedCode(key: string): string | null {
  return get<string | null>(`code_${key}`, null);
}

export function saveCode(key: string, code: string): void {
  set(`code_${key}`, code);
}

// ── Simulator scratch code ─────────────────────────

export function getSimulatorCode(): string | null {
  return get<string | null>('simulator_code', null);
}

export function saveSimulatorCode(code: string): void {
  set('simulator_code', code);
}

// ── Saved programs ────────────────────────────────

export interface SavedProgram {
  name: string;
  code: string;
  savedAt: number;
}

export function getSavedPrograms(): SavedProgram[] {
  return get<SavedProgram[]>('saved_programs', []);
}

export function saveProgram(name: string, code: string): void {
  const programs = getSavedPrograms();
  const idx = programs.findIndex(p => p.name === name);
  const entry: SavedProgram = { name, code, savedAt: Date.now() };
  if (idx >= 0) {
    programs[idx] = entry;
  } else {
    programs.push(entry);
  }
  set('saved_programs', programs);
}

export function deleteProgram(name: string): void {
  const programs = getSavedPrograms().filter(p => p.name !== name);
  set('saved_programs', programs);
}

// ── Project test results ───────────────────────────

export function getProjectPassed(id: string): boolean {
  return get<boolean>(`project_passed_${id}`, false);
}

export function markProjectPassed(id: string): void {
  set(`project_passed_${id}`, true);
}
