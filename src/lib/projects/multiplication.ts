import { Project } from './types';

const project: Project = {
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
};

export default project;
