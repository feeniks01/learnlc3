import { Project } from './types';

const project: Project = {
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
};

export default project;
