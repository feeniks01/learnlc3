export type { TestCase, Project } from './types';

import helloWorld from './hello-world';
import echo from './echo';
import countdown from './countdown';
import stringLength from './string-length';
import sumArray from './sum-array';
import charCounter from './char-counter';
import countVowels from './count-vowels';
import multiplication from './multiplication';
import findMaximum from './find-maximum';
import fibonacci from './fibonacci';
import bubbleSort from './bubble-sort';
import reverseString from './reverse-string';
import binaryToDecimal from './binary-to-decimal';
import removeSpaces from './remove-spaces';
import palindrome from './palindrome';

import { Project } from './types';

const DIFFICULTY_ORDER: Record<Project['difficulty'], number> = {
  Advanced: 0,
  Intermediate: 1,
  Beginner: 2,
};

/**
 * All projects, sorted by descending difficulty (Advanced first, Beginner last).
 *
 * To add a new project:
 * 1. Create a new file in src/lib/projects/ (copy _template.ts)
 * 2. Import it here
 * 3. Add it to the allProjects array below
 */
const allProjects: Project[] = [
  helloWorld,
  echo,
  countdown,
  stringLength,
  sumArray,
  charCounter,
  countVowels,
  multiplication,
  findMaximum,
  fibonacci,
  bubbleSort,
  reverseString,
  binaryToDecimal,
  removeSpaces,
  palindrome,
];

export const projects = allProjects.sort(
  (a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]
);

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}
