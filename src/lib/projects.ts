export interface TestCase {
  description: string;
  input?: string;
  expectedOutput?: string;
  preloadMemory?: { address: number; value: number }[];
  checkMemory?: { address: number; value: number }[];
  checkRegisters?: { register: number; value: number }[];
}

export interface Project {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  details: string;
  hints: string[];
  starter: string;
  tests: TestCase[];
}

export const projects: Project[] = [
  {
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
  },

  {
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
  },

  {
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
  },

  {
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
  },

  {
    id: 'char-counter',
    title: 'Character Counter',
    difficulty: 'Intermediate',
    description: 'Count occurrences of a character in a string.',
    details: `Write a program that counts how many times the letter 'l' appears in the string "Hello, World!" and prints the count.

**Requirements:**
- Count occurrences of the character at label CHAR in the string at label STR
- Print the count as an ASCII digit
- The answer should be 3 (three lowercase 'l's in "Hello, World!")

**Data:**
\`\`\`
STR  .STRINGZ "Hello, World!"
CHAR .FILL #108  ; ASCII 'l'
\`\`\``,
    hints: [
      'Walk through each character of the string using a pointer',
      'Compare each character with CHAR using subtraction',
      'If the difference is zero, they match — increment counter',
      'Stop when you hit the null terminator (0)',
    ],
    starter: `.ORIG x3000
; Load search character and string pointer

; Walk string, counting matches

; Print count

HALT

STR  .STRINGZ "Hello, World!"
CHAR .FILL #108
.END`,
    tests: [
      { description: 'Counts 3 occurrences of "l"', expectedOutput: '3' },
    ],
  },

  {
    id: 'multiplication',
    title: 'Multiply Subroutine',
    difficulty: 'Intermediate',
    description: 'Write a subroutine that multiplies two numbers.',
    details: `Write a MULTIPLY subroutine that computes R0 * R1 and returns the result in R0.

**Requirements:**
- The subroutine label must be MULTIPLY
- Input: R0 and R1 contain the two numbers
- Output: R0 = R0 * R1
- Must save and restore all registers it uses (except R0)
- Must handle the case where either input is 0
- Main program should compute 6 * 7 = 42, then print '4' followed by '2'

**To print a two-digit number:**
- Divide by 10 to get the tens digit (count how many times you can subtract 10)
- The remainder is the ones digit
- Convert each to ASCII and print`,
    hints: [
      'Multiplication is repeated addition: 6*7 = 6+6+6+6+6+6+6',
      'Use R1 as a counter, adding R0 to an accumulator each iteration',
      'Save R7 if your subroutine might be called from another subroutine',
      'For the division by 10: subtract 10 repeatedly, counting iterations',
    ],
    starter: `.ORIG x3000
LD R6, STACK

; Set up: R0 = 6, R1 = 7
AND R0, R0, #0
ADD R0, R0, #6
AND R1, R1, #0
ADD R1, R1, #7

; Call MULTIPLY
JSR MULTIPLY

; R0 = 42, print as "42"
; Divide by 10 for tens digit
; ... your printing code ...

HALT

;----------------------------
; MULTIPLY: R0 = R0 * R1
;----------------------------
MULTIPLY
; Your subroutine here

RET

STACK .FILL xFE00
.END`,
    tests: [
      { description: 'Prints "42" (6 * 7)', expectedOutput: '42' },
    ],
  },

  {
    id: 'fibonacci',
    title: 'Fibonacci Sequence',
    difficulty: 'Advanced',
    description: 'Compute and print the first N Fibonacci numbers.',
    details: `Write a program that computes and prints the first 7 Fibonacci numbers: 1, 1, 2, 3, 5, 8, 13.

Since some numbers are multi-digit, separate them with spaces. However, for simplicity in autograding, just print the single digits: \`1123581\` (concatenated, skipping 13 since it's > 9).

Actually, let's print the first 7 values that fit in a single digit. Fib: 1,1,2,3,5,8 — that's 6 values before 13.

**Requirements:**
- Print: \`112358\` (first 6 Fibonacci numbers, all single digits)
- Use a loop, not hardcoded prints

**Algorithm:**
1. a = 1, b = 1
2. Print a
3. next = a + b, a = b, b = next
4. Repeat`,
    hints: [
      'Use two registers for the current pair (e.g., R1 and R2)',
      'On each iteration: print R1, compute R3 = R1 + R2, shift R1 = R2, R2 = R3',
      'Use a counter to stop after 6 iterations',
      'Convert each value to ASCII by adding 48 before printing',
    ],
    starter: `.ORIG x3000
; Initialize: R1 = 1, R2 = 1, counter R4 = 6

; Loop: print current, compute next

HALT
.END`,
    tests: [
      { description: 'Prints first 6 Fibonacci numbers', expectedOutput: '112358' },
    ],
  },

  {
    id: 'bubble-sort',
    title: 'Bubble Sort',
    difficulty: 'Advanced',
    description: 'Sort an array of single-digit numbers and print them in order.',
    details: `Implement bubble sort to sort the array {5, 2, 8, 1, 4} in ascending order, then print the sorted digits.

**Requirements:**
- Sort the array in-place using bubble sort
- Print the sorted array as digits: \`12458\`
- The array is defined at label ARRAY with 5 elements
- N is stored at label N

**Algorithm:**
\`\`\`
for i = 0 to n-2:
  for j = 0 to n-2-i:
    if array[j] > array[j+1]:
      swap array[j] and array[j+1]
\`\`\``,
    hints: [
      'Use an outer loop counter and inner loop counter',
      'Compare adjacent elements by subtracting (A - B > 0 means A > B)',
      'Swap using LDR/STR with the base pointer',
      'After sorting, walk the array and print each element as ASCII',
    ],
    starter: `.ORIG x3000
; Sort ARRAY using bubble sort

; Print sorted array

HALT

N     .FILL #5
ARRAY .FILL #5
      .FILL #2
      .FILL #8
      .FILL #1
      .FILL #4
.END`,
    tests: [
      { description: 'Sorts and prints "12458"', expectedOutput: '12458' },
    ],
  },

  // ── PRACTICE PROBLEMS ────────────────────────────────
  {
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
  },

  {
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
  },

  {
    id: 'find-maximum',
    title: 'Find Maximum',
    difficulty: 'Intermediate',
    description: 'Find the maximum value and its index in an array.',
    details: `An array of 10 signed integers is stored in memory starting at location \`x5000\`. Write a program to find the maximum value and store it at memory location \`x6000\`. Also store the index (0-9) of the maximum value at location \`x6001\`.

**How to Think About This Problem:**

**Step 1: Understand the data**
- 10 integers at x5000, x5001, x5002... x5009
- They're signed (can be negative)
- Need to find biggest one and where it is

**Step 2: Algorithm (think like a human first)**
- Assume first element is the max
- Look at each other element
- If it's bigger than current max, update max and remember its position
- After checking all, you have the answer

**Step 3: What registers do you need?**
- R1 = pointer to current element
- R2 = loop counter
- R3 = current max value
- R4 = index of current max
- R5 = current index being checked
- R0 = temporary for loading/comparing

**Step 4: Comparing signed numbers**
To check if A > B:
- Compute A - B (using NOT + ADD for negation)
- If result is positive, A > B`,
    hints: [
      'Initialize max to the first element, then scan remaining 9 elements',
      'To compare: negate current max (NOT + ADD #1), then add current element. If result is positive, current element is bigger',
      'Track both the max value AND its index in separate registers',
      'Use STI to store results at x6000 and x6001',
    ],
    starter: `.ORIG x3000
    LD R1, ARRAY_START     ; R1 = x5000
    LDR R3, R1, #0         ; R3 = first element (initial max)
    AND R4, R4, #0         ; R4 = 0 (index of max)
    AND R5, R5, #0
    ADD R5, R5, #1         ; R5 = 1 (current index)
    ADD R1, R1, #1         ; point to second element

    LD R6, COUNT           ; R6 = 9 (check 9 more elements)

CHECK_LOOP
    ; Load current element, compare with max
    ; If bigger, update max (R3) and index (R4)


NOT_BIGGER
    ADD R1, R1, #1         ; move pointer
    ADD R5, R5, #1         ; increment current index
    ADD R6, R6, #-1        ; decrement counter
    BRp CHECK_LOOP

    STI R3, MAX_RESULT
    STI R4, INDEX_RESULT
    HALT

ARRAY_START .FILL x5000
MAX_RESULT .FILL x6000
INDEX_RESULT .FILL x6001
COUNT .FILL #9
.END`,
    tests: [
      {
        description: 'Max of {3,7,2,9,1,5,4,8,6,0} is 9 at index 3',
        preloadMemory: [
          { address: 0x5000, value: 3 },
          { address: 0x5001, value: 7 },
          { address: 0x5002, value: 2 },
          { address: 0x5003, value: 9 },
          { address: 0x5004, value: 1 },
          { address: 0x5005, value: 5 },
          { address: 0x5006, value: 4 },
          { address: 0x5007, value: 8 },
          { address: 0x5008, value: 6 },
          { address: 0x5009, value: 0 },
        ],
        checkMemory: [
          { address: 0x6000, value: 9 },
          { address: 0x6001, value: 3 },
        ],
      },
      {
        description: 'Max of {1,1,1,1,1,1,1,1,1,5} is 5 at index 9',
        preloadMemory: [
          { address: 0x5000, value: 1 },
          { address: 0x5001, value: 1 },
          { address: 0x5002, value: 1 },
          { address: 0x5003, value: 1 },
          { address: 0x5004, value: 1 },
          { address: 0x5005, value: 1 },
          { address: 0x5006, value: 1 },
          { address: 0x5007, value: 1 },
          { address: 0x5008, value: 1 },
          { address: 0x5009, value: 5 },
        ],
        checkMemory: [
          { address: 0x6000, value: 5 },
          { address: 0x6001, value: 9 },
        ],
      },
    ],
  },

  {
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
  },

  {
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
  },

  {
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
  },
];

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}
