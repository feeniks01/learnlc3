import { Project } from './types';

const project: Project = {
  id: 'hello-world',
  title: 'Hello World',
  difficulty: 'Beginner',
  description: 'Print "Hello, World!" to the console.',
  details: `Write an LC-3 program that prints the string "Hello, World!" to the console and halts.

**Requirements:**
- Output must be exactly: \`Hello, World!\`
- Program must halt after printing

**Useful instructions:** \`LEA\`, \`PUTS\`, \`HALT\``,
  hints: [
    'Use .STRINGZ to define the string in memory',
    'LEA loads the address of a label into a register',
    'PUTS prints the string at the address in R0',
  ],
  starter: `.ORIG x3000
; Your code here

.END`,
  tests: [
    { description: 'Prints "Hello, World!"', expectedOutput: 'Hello, World!' },
  ],
};

export default project;
