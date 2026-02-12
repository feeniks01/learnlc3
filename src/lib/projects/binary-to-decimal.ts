import { Project } from './types';

const project: Project = {
  id: 'binary-to-decimal',
  title: 'Binary to Decimal',
  difficulty: 'Advanced',
  description: 'Convert a binary string to its decimal value.',
  details: `A null-terminated string at \`x5000\` contains only '0' and '1' characters representing a binary number (e.g., "1101"). Convert this to its decimal value and store the result at \`x6000\`. The binary number will be at most 8 bits (value 0-255).

**Requirements:**
- The string contains only ASCII '0' (x30) and '1' (x31) characters
- Convert the binary representation to its integer value
- Store the result at x6000

**Algorithm:** Process left to right. For each digit:
\`\`\`
result = result * 2 + digit
\`\`\`

**Example:** "1101"
- Start: result = 0
- Read '1': result = 0 * 2 + 1 = 1
- Read '1': result = 1 * 2 + 1 = 3
- Read '0': result = 3 * 2 + 0 = 6
- Read '1': result = 6 * 2 + 1 = 13

**Key insight:** Multiplication by 2 is just \`ADD R0, R0, R0\` (adding a number to itself).`,
  hints: [
    'Convert ASCII \'0\'/\'1\' to numeric 0/1 by subtracting x30 (48 decimal)',
    'Multiply by 2: ADD R2, R2, R2 doubles the result register',
    'Process characters left to right: result = result * 2 + currentDigit',
    'Use LDR to load characters and BRz to detect the null terminator',
  ],
  starter: `.ORIG x3000
    LD R1, STRING_ADDR     ; R1 = pointer to binary string
    AND R2, R2, #0         ; R2 = result (starts at 0)

    ; Process each character left to right
CONVERT_LOOP
    LDR R0, R1, #0         ; load current character
    BRz CONVERT_DONE       ; if null, done

    ; Convert ASCII to digit: subtract '0' (x30)

    ; result = result * 2 + digit

    ; Advance pointer
    ADD R1, R1, #1
    BRnzp CONVERT_LOOP

CONVERT_DONE
    STI R2, RESULT
    HALT

STRING_ADDR .FILL x5000
RESULT .FILL x6000
ASCII_ZERO .FILL #-48
.END`,
  tests: [
    {
      description: '"1101" = 13',
      preloadMemory: [
        { address: 0x5000, value: 0x31 },
        { address: 0x5001, value: 0x31 },
        { address: 0x5002, value: 0x30 },
        { address: 0x5003, value: 0x31 },
        { address: 0x5004, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 13 }],
    },
    {
      description: '"10000000" = 128',
      preloadMemory: [
        { address: 0x5000, value: 0x31 },
        { address: 0x5001, value: 0x30 },
        { address: 0x5002, value: 0x30 },
        { address: 0x5003, value: 0x30 },
        { address: 0x5004, value: 0x30 },
        { address: 0x5005, value: 0x30 },
        { address: 0x5006, value: 0x30 },
        { address: 0x5007, value: 0x30 },
        { address: 0x5008, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 128 }],
    },
    {
      description: '"1" = 1',
      preloadMemory: [
        { address: 0x5000, value: 0x31 },
        { address: 0x5001, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 1 }],
    },
    {
      description: '"0" = 0',
      preloadMemory: [
        { address: 0x5000, value: 0x30 },
        { address: 0x5001, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 0 }],
    },
  ],
};

export default project;
