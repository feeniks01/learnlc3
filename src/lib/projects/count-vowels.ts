import { Project } from './types';

const project: Project = {
  id: 'count-vowels',
  title: 'Count Vowels',
  difficulty: 'Intermediate',
  description: 'Count the number of vowels in an uppercase string.',
  details: `Write a program to count the number of vowels (A, E, I, O, U) in a null-terminated string stored at \`x5000\`. Store the count in memory location \`x6000\`. Assume all letters are uppercase.

**Requirements:**
- Count only the characters A, E, I, O, U
- The string at x5000 is null-terminated and all uppercase
- Store the vowel count at x6000

**ASCII values:**
| Letter | Hex  | Decimal |
|--------|------|---------|
| A      | x41  | 65      |
| E      | x45  | 69      |
| I      | x49  | 73      |
| O      | x4F  | 79      |
| U      | x55  | 85      |

**Approach:** For each character, subtract each vowel's ASCII value and check if the result is zero. If (char - 'A') == 0, it's an 'A'.`,
  hints: [
    'Walk through the string character by character using a pointer register',
    'For each character, check against all 5 vowels using subtraction',
    'Use NOT + ADD to negate a value, then ADD to subtract: if result is zero (BRz), it matches',
    'You\'ll need the negative ASCII values of each vowel stored in memory (e.g., NEG_A .FILL #-65)',
  ],
  starter: `.ORIG x3000
    LD R1, STRING_START    ; R1 = pointer to string
    AND R2, R2, #0         ; R2 = vowel counter

    ; Loop through each character
LOOP
    LDR R0, R1, #0         ; load current character
    BRz DONE               ; if null, we're done

    ; Check if R0 is a vowel (A, E, I, O, U)
    ; Hint: for each vowel, compute R0 - vowel and BRz

    ; ... your vowel checking code here ...

NEXT_CHAR
    ADD R1, R1, #1         ; advance pointer
    BRnzp LOOP

DONE
    STI R2, RESULT
    HALT

STRING_START .FILL x5000
RESULT .FILL x6000
; Store negative ASCII values for comparison
NEG_A .FILL #-65
NEG_E .FILL #-69
NEG_I .FILL #-73
NEG_O .FILL #-79
NEG_U .FILL #-85
.END`,
  tests: [
    {
      description: '"AEIOU" has 5 vowels',
      preloadMemory: [
        { address: 0x5000, value: 0x41 },
        { address: 0x5001, value: 0x45 },
        { address: 0x5002, value: 0x49 },
        { address: 0x5003, value: 0x4F },
        { address: 0x5004, value: 0x55 },
        { address: 0x5005, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 5 }],
    },
    {
      description: '"HELLO" has 2 vowels (E, O)',
      preloadMemory: [
        { address: 0x5000, value: 0x48 },
        { address: 0x5001, value: 0x45 },
        { address: 0x5002, value: 0x4C },
        { address: 0x5003, value: 0x4C },
        { address: 0x5004, value: 0x4F },
        { address: 0x5005, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 2 }],
    },
    {
      description: '"XYZ" has 0 vowels',
      preloadMemory: [
        { address: 0x5000, value: 0x58 },
        { address: 0x5001, value: 0x59 },
        { address: 0x5002, value: 0x5A },
        { address: 0x5003, value: 0x00 },
      ],
      checkMemory: [{ address: 0x6000, value: 0 }],
    },
  ],
};

export default project;
