import { Project } from './types';

const project: Project = {
  id: 'reverse-string',
  title: 'Reverse String In Place',
  difficulty: 'Advanced',
  description: 'Reverse a null-terminated string in memory.',
  details: `A null-terminated string is stored at memory location \`x5000\`. Write a program to reverse the string in place (modify the original memory). For example, "HELLO" becomes "OLLEH".

**Requirements:**
- Reverse the string stored at x5000 in place
- The null terminator should remain at the end
- Store the length of the string at x6000

**Algorithm:**
1. First find the end of the string (scan for null terminator)
2. Use two pointers: one at start, one at end
3. Swap characters at those positions
4. Move pointers toward each other
5. Stop when they meet or cross

**Swapping two values:**
\`\`\`
LDR R2, R1, #0    ; R2 = value at pointer 1
LDR R3, R4, #0    ; R3 = value at pointer 2
STR R3, R1, #0    ; store pointer 2's value at pointer 1
STR R2, R4, #0    ; store pointer 1's value at pointer 2
\`\`\``,
  hints: [
    'First walk the string to find its length and the address of the last character',
    'Set up two pointers: R1 = start (x5000), R3 = end (x5000 + length - 1)',
    'To check if R1 < R3: compute R3 - R1, if positive, keep swapping',
    'Use LDR to load and STR to store when swapping via registers',
  ],
  starter: `.ORIG x3000
    LD R1, STRING_ADDR     ; R1 = x5000 (start pointer)

    ; Step 1: Find end of string
    ADD R3, R1, #0         ; R3 = copy of start
    AND R5, R5, #0         ; R5 = length counter
FIND_END
    LDR R0, R3, #0
    BRz FOUND_END
    ADD R3, R3, #1
    ADD R5, R5, #1
    BRnzp FIND_END
FOUND_END
    ; R3 now points to null terminator
    ; R5 = length
    STI R5, RESULT         ; store length at x6000
    ADD R3, R3, #-1        ; R3 = last character

    ; Step 2: Swap loop while R1 < R3
SWAP_LOOP
    ; Check if R1 < R3, if not done
    ; Swap characters at R1 and R3
    ; Advance R1 forward, R3 backward

    ; ... your swap code here ...


SWAP_DONE
    HALT

STRING_ADDR .FILL x5000
RESULT .FILL x6000
.END`,
  tests: [
    {
      description: 'Reverses "HELLO" to "OLLEH"',
      preloadMemory: [
        { address: 0x5000, value: 0x48 },
        { address: 0x5001, value: 0x45 },
        { address: 0x5002, value: 0x4C },
        { address: 0x5003, value: 0x4C },
        { address: 0x5004, value: 0x4F },
        { address: 0x5005, value: 0x00 },
      ],
      checkMemory: [
        { address: 0x5000, value: 0x4F },
        { address: 0x5001, value: 0x4C },
        { address: 0x5002, value: 0x4C },
        { address: 0x5003, value: 0x45 },
        { address: 0x5004, value: 0x48 },
        { address: 0x6000, value: 5 },
      ],
    },
    {
      description: 'Reverses "AB" to "BA"',
      preloadMemory: [
        { address: 0x5000, value: 0x41 },
        { address: 0x5001, value: 0x42 },
        { address: 0x5002, value: 0x00 },
      ],
      checkMemory: [
        { address: 0x5000, value: 0x42 },
        { address: 0x5001, value: 0x41 },
        { address: 0x6000, value: 2 },
      ],
    },
    {
      description: 'Single character "A" stays "A"',
      preloadMemory: [
        { address: 0x5000, value: 0x41 },
        { address: 0x5001, value: 0x00 },
      ],
      checkMemory: [
        { address: 0x5000, value: 0x41 },
        { address: 0x6000, value: 1 },
      ],
    },
  ],
};

export default project;
