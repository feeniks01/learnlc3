import { Project } from './types';

const project: Project = {
  id: 'palindrome',
  title: 'Palindrome Checker',
  difficulty: 'Advanced',
  description: 'Check if a null-terminated string is a palindrome, ignoring spaces.',
  details: `Write a program to check if a null-terminated string stored in memory starting at location \`x5000\` is a palindrome. Store **1** in memory location \`x6000\` if it is a palindrome, **-1** otherwise.

A palindrome is an expression that reads the same from left to right or from right to left. **Spaces should be ignored** and you can assume all letters are in uppercase.

**Requirements:**
- The string at x5000 is null-terminated and all uppercase
- Spaces (ASCII x20) should be skipped when comparing
- Store 1 at x6000 if the string is a palindrome
- Store -1 (xFFFF) at x6000 if it is not

**Suggested Algorithm:**
1. Set R1 to point to the first character of the string, R2 to point to the last character
2. Skip any spaces at R1 (advance forward) and R2 (advance backward)
3. Compare characters pointed to by R1 and R2
4. If they are the same, go to the next step. Otherwise, store -1 in memory location x6000 and stop
5. Update R1 (forward) and R2 (backward). If they have not crossed each other, go to step 2, else the string is a palindrome — store 1 at x6000 and stop

**Key Insight:** To find the last character, first walk the string to find the null terminator, then back up one position.

**ASCII Reference:**
| Character | Hex  | Decimal |
|-----------|------|---------|
| Space     | x20  | 32      |
| A         | x41  | 65      |
| Z         | x5A  | 90      |`,
  hints: [
    'First, walk the string to find the null terminator so you know where the last character is',
    'Use two pointers: R1 starts at the beginning, R2 starts at the last character. Move them toward each other.',
    'To skip spaces: after loading a character, compare it with ASCII 32 (space). If it matches, advance the pointer and try again.',
    'To compare two characters: subtract one from the other. If the result is zero (BRz), they match.',
    'To check if pointers have crossed: compute R2 - R1. If the result is zero or negative (BRnz), you\'re done — it\'s a palindrome.',
  ],
  starter: `.ORIG x3000
; Your code here

.END`,
  tests: [
    {
      description: '"RACECAR" is a palindrome (store 1)',
      preloadMemory: [
        { address: 0x5000, value: 0x52 }, // R
        { address: 0x5001, value: 0x41 }, // A
        { address: 0x5002, value: 0x43 }, // C
        { address: 0x5003, value: 0x45 }, // E
        { address: 0x5004, value: 0x43 }, // C
        { address: 0x5005, value: 0x41 }, // A
        { address: 0x5006, value: 0x52 }, // R
        { address: 0x5007, value: 0x00 }, // null
      ],
      checkMemory: [{ address: 0x6000, value: 1 }],
    },
    {
      description: '"HELLO" is not a palindrome (store -1)',
      preloadMemory: [
        { address: 0x5000, value: 0x48 }, // H
        { address: 0x5001, value: 0x45 }, // E
        { address: 0x5002, value: 0x4C }, // L
        { address: 0x5003, value: 0x4C }, // L
        { address: 0x5004, value: 0x4F }, // O
        { address: 0x5005, value: 0x00 }, // null
      ],
      checkMemory: [{ address: 0x6000, value: -1 }],
    },
    {
      description: '"TACO CAT" is a palindrome with spaces (store 1)',
      preloadMemory: [
        { address: 0x5000, value: 0x54 }, // T
        { address: 0x5001, value: 0x41 }, // A
        { address: 0x5002, value: 0x43 }, // C
        { address: 0x5003, value: 0x4F }, // O
        { address: 0x5004, value: 0x20 }, // (space)
        { address: 0x5005, value: 0x43 }, // C
        { address: 0x5006, value: 0x41 }, // A
        { address: 0x5007, value: 0x54 }, // T
        { address: 0x5008, value: 0x00 }, // null
      ],
      checkMemory: [{ address: 0x6000, value: 1 }],
    },
    {
      description: '"A" single character is a palindrome (store 1)',
      preloadMemory: [
        { address: 0x5000, value: 0x41 }, // A
        { address: 0x5001, value: 0x00 }, // null
      ],
      checkMemory: [{ address: 0x6000, value: 1 }],
    },
    {
      description: '"AB BA" is a palindrome with space (store 1)',
      preloadMemory: [
        { address: 0x5000, value: 0x41 }, // A
        { address: 0x5001, value: 0x42 }, // B
        { address: 0x5002, value: 0x20 }, // (space)
        { address: 0x5003, value: 0x42 }, // B
        { address: 0x5004, value: 0x41 }, // A
        { address: 0x5005, value: 0x00 }, // null
      ],
      checkMemory: [{ address: 0x6000, value: 1 }],
    },
  ],
};

export default project;
