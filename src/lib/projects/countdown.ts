import { Project } from './types';

const project: Project = {
  id: 'countdown',
  title: 'Countdown',
  difficulty: 'Beginner',
  description: 'Print a countdown from 9 to 0.',
  details: `Write a program that prints the digits 9 through 0, each on the same line.

**Requirements:**
- Output must be exactly: \`9876543210\`
- Use a loop (don't just print each character individually)
- Halt after printing

**Hint:** ASCII '0' is 48 (decimal). To convert a digit n to its ASCII representation, add 48.`,
  hints: [
    'Start a counter at 9, loop until it reaches -1',
    'To convert digit to ASCII: ADD Rn, Rn, #48... but 48 > 15 so use multiple ADDs',
    'Remember: ADD immediate is limited to -16 to +15',
  ],
  starter: `.ORIG x3000
; Initialize counter to 9

; Loop: convert to ASCII, print, decrement

HALT
.END`,
  tests: [
    { description: 'Prints "9876543210"', expectedOutput: '9876543210' },
  ],
};

export default project;
