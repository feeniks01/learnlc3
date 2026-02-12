import { Project } from './types';

const project: Project = {
  id: 'sum-array',
  title: 'Array Sum',
  difficulty: 'Intermediate',
  description: 'Sum the elements of an array and print the result.',
  details: `Write a program that sums the elements of a predefined array and prints the result as a single ASCII digit.

**Array:** {2, 4, 1, 3} (sum = 10... but 10 is two digits)
Let's use: {1, 2, 1, 2} (sum = 6)

**Requirements:**
- Sum the 4 elements starting at label ARRAY
- The count of elements is stored at label COUNT
- Print the sum as a single ASCII digit
- Halt after printing

**Data layout:**
\`\`\`
COUNT .FILL #4
ARRAY .FILL #1
      .FILL #2
      .FILL #1
      .FILL #2
\`\`\``,
  hints: [
    'Use LEA to get the array base address, LD to get the count',
    'LDR with base+offset is ideal for array access',
    'Don\'t forget to convert the number to ASCII before printing',
  ],
  starter: `.ORIG x3000
; Load count and array address

; Sum loop

; Convert to ASCII and print

HALT

COUNT .FILL #4
ARRAY .FILL #1
      .FILL #2
      .FILL #1
      .FILL #2
.END`,
  tests: [
    { description: 'Prints "6" (sum of 1+2+1+2)', expectedOutput: '6' },
  ],
};

export default project;
