import { Project } from './types';

const project: Project = {
  id: 'fibonacci',
  title: 'Fibonacci Sequence',
  difficulty: 'Advanced',
  description: 'Compute and print the first N Fibonacci numbers.',
  details: `Write a program that computes and prints the first 7 Fibonacci numbers: 1, 1, 2, 3, 5, 8, 13.

Since some numbers are multi-digit, separate them with spaces. However, for simplicity in autograding, just print the single digits: \`1123581\` (concatenated, skipping 13 since it's > 9).

Actually, let's print the first 7 values that fit in a single digit. Fib: 1,1,2,3,5,8 — that's 6 values before 13.

**Requirements:**
- Print: \`112358\` (first 6 Fibonacci numbers, all single digits)
- Use a loop, not hardcoded prints

**Algorithm:**
1. a = 1, b = 1
2. Print a
3. next = a + b, a = b, b = next
4. Repeat`,
  hints: [
    'Use two registers for the current pair (e.g., R1 and R2)',
    'On each iteration: print R1, compute R3 = R1 + R2, shift R1 = R2, R2 = R3',
    'Use a counter to stop after 6 iterations',
    'Convert each value to ASCII by adding 48 before printing',
  ],
  starter: `.ORIG x3000
; Initialize: R1 = 1, R2 = 1, counter R4 = 6

; Loop: print current, compute next

HALT
.END`,
  tests: [
    { description: 'Prints first 6 Fibonacci numbers', expectedOutput: '112358' },
  ],
};

export default project;
