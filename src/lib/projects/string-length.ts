import { Project } from './types';

const project: Project = {
  id: 'string-length',
  title: 'String Length',
  difficulty: 'Beginner',
  description: 'Find the length of a null-terminated string in memory.',
  details: `Write a program to find the length of a null-terminated string stored in memory starting at location \`x5000\`. Store the length (number of characters, not including the null terminator) in memory location \`x6000\`.

**How to Think About This Problem:**

**Step 1: Understand what you have**
- A string starting at x5000
- Each character is at consecutive memory addresses: x5000, x5001, x5002...
- The string ends with a null character (x00)

**Step 2: What do you need?**
- Count how many characters before the null
- Store that count at x6000

**Step 3: Break it into pieces**
1. Set up a pointer to the start of the string
2. Set up a counter (starts at 0)
3. Load the character at the pointer
4. If it's null, we're done
5. If not null, increment counter, move pointer forward, repeat

**Step 4: Map to LC-3**
- R1 = pointer (address), starts at x5000
- R2 = counter, starts at 0
- Use \`LDR R0, R1, #0\` to load character at address R1
- Use \`BRz\` to check for null (null = 0, so BRz triggers)

**Useful patterns:**
\`\`\`
LD R1, PTR        ; Load x5000 into R1
LDR R0, R1, #0   ; Load character at address R1
STI R2, RESULT    ; Store R2 to address stored at RESULT
\`\`\``,
  hints: [
    'Use LD to load the address x5000 into a register, then use LDR to read characters one at a time',
    'BRz checks if the last result was zero — perfect for null terminator detection',
    'Use STI to store the result at x6000 (indirect store through a label containing x6000)',
    'The null terminator should NOT be counted in the length',
  ],
  starter: `.ORIG x3000
    LD R1, STRING_START    ; R1 = x5000 (pointer to string)
    AND R2, R2, #0         ; R2 = 0 (counter)

    ; Loop: load char at pointer, check for null, count
COUNT_LOOP


DONE
    STI R2, RESULT         ; store count at x6000
    HALT

STRING_START .FILL x5000
RESULT .FILL x6000
.END`,
  tests: [
    {
      description: 'Length of "HELLO" is 5',
      preloadMemory: [
        { address: 0x5000, value: 0x48 },
        { address: 0x5001, value: 0x45 },
        { address: 0x5002, value: 0x4C },
        { address: 0x5003, value: 0x4C },
        { address: 0x5004, value: 0x4F },
        { address: 0x5005, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 5 }],
    },
    {
      description: 'Length of "AB" is 2',
      preloadMemory: [
        { address: 0x5000, value: 0x41 },
        { address: 0x5001, value: 0x42 },
        { address: 0x5002, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 2 }],
    },
    {
      description: 'Length of empty string is 0',
      preloadMemory: [
        { address: 0x5000, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 0 }],
    },
  ],
};

export default project;
