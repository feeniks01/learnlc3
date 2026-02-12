import { Project } from './types';

const project: Project = {
  id: 'echo',
  title: 'Character Echo',
  difficulty: 'Beginner',
  description: 'Read a character and print it back 5 times.',
  details: `Write a program that reads a single character from the keyboard and prints it 5 times.

**Requirements:**
- Read one character using GETC
- Print that character 5 times using OUT
- Halt after printing

**Example:** If user types 'A', output should be: \`AAAAA\``,
  hints: [
    'GETC reads a character into R0',
    'OUT prints the character in R0',
    'You can use a counter register with a loop',
  ],
  starter: `.ORIG x3000
; Read character

; Print it 5 times

HALT
.END`,
  tests: [
    { description: 'Echoes "A" five times', input: 'A', expectedOutput: 'AAAAA' },
    { description: 'Echoes "z" five times', input: 'z', expectedOutput: 'zzzzz' },
  ],
};

export default project;
