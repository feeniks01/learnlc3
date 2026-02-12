import { Project } from './types';

const project: Project = {
  id: 'remove-spaces',
  title: 'Remove Spaces',
  difficulty: 'Advanced',
  description: 'Remove all spaces from a string in place.',
  details: `A null-terminated string is stored at \`x5000\`. Write a program to remove all spaces from the string, modifying it in place. Store the new length (after removing spaces) at \`x6000\`.

**Example:** "H E L L O" becomes "HELLO" and store 5 at x6000.

**Requirements:**
- Remove all space characters (ASCII x20 / decimal 32) from the string
- Modify the string in place at x5000
- Write a null terminator after the last non-space character
- Store the new length at x6000

**Algorithm: Two-pointer approach**
- Read pointer: scans through original string
- Write pointer: tracks where to write next non-space character
- For each character:
  - If it's a space, skip it (advance read pointer only)
  - If it's not a space, write it at the write pointer position, advance both
- At the end, write null terminator at write pointer position
- Length = write pointer - start address`,
  hints: [
    'Use two registers as pointers: one for reading (R1) and one for writing (R2)',
    'Both start at x5000, but the write pointer only advances for non-space characters',
    'Compare each character with space (ASCII 32): subtract 32, if zero it\'s a space',
    'Don\'t forget to write the null terminator at the end',
  ],
  starter: `.ORIG x3000
    LD R1, STRING_ADDR     ; R1 = read pointer
    LD R2, STRING_ADDR     ; R2 = write pointer
    AND R5, R5, #0         ; R5 = new length counter

    ; Read each character
READ_LOOP
    LDR R0, R1, #0         ; load char at read pointer
    BRz READ_DONE          ; if null, done reading

    ; Check if space (ASCII 32)
    ; If space, skip. If not space, write and count.

    ; ... your code here ...

    ADD R1, R1, #1         ; advance read pointer
    BRnzp READ_LOOP

READ_DONE
    ; Write null terminator at write pointer
    AND R0, R0, #0
    STR R0, R2, #0

    STI R5, RESULT
    HALT

STRING_ADDR .FILL x5000
RESULT .FILL x6000
NEG_SPACE .FILL #-32
.END`,
  tests: [
    {
      description: '"H E L L O" becomes "HELLO", length 5',
      preloadMemory: [
        { address: 0x5000, value: 0x48 },
        { address: 0x5001, value: 0x20 },
        { address: 0x5002, value: 0x45 },
        { address: 0x5003, value: 0x20 },
        { address: 0x5004, value: 0x4C },
        { address: 0x5005, value: 0x20 },
        { address: 0x5006, value: 0x4C },
        { address: 0x5007, value: 0x20 },
        { address: 0x5008, value: 0x4F },
        { address: 0x5009, value: 0x00 },
      ],
      checkMemory: [
        { address: 0x5000, value: 0x48 },
        { address: 0x5001, value: 0x45 },
        { address: 0x5002, value: 0x4C },
        { address: 0x5003, value: 0x4C },
        { address: 0x5004, value: 0x4F },
        { address: 0x6000, value: 5 },
      ],
    },
    {
      description: '"ABC" (no spaces) stays "ABC", length 3',
      preloadMemory: [
        { address: 0x5000, value: 0x41 },
        { address: 0x5001, value: 0x42 },
        { address: 0x5002, value: 0x43 },
        { address: 0x5003, value: 0x00 },
      ],
      checkMemory: [
        { address: 0x5000, value: 0x41 },
        { address: 0x5001, value: 0x42 },
        { address: 0x5002, value: 0x43 },
        { address: 0x6000, value: 3 },
      ],
    },
    {
      description: '"   " (all spaces) becomes empty, length 0',
      preloadMemory: [
        { address: 0x5000, value: 0x20 },
        { address: 0x5001, value: 0x20 },
        { address: 0x5002, value: 0x20 },
        { address: 0x5003, value: 0x00 },
      ],
      checkMemory: [
        { address: 0x6000, value: 0 },
      ],
    },
  ],
};

export default project;
