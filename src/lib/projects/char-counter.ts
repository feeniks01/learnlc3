import { Project } from './types';

const project: Project = {
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
CHECK_STRING  .STRINGZ "Hello, World!"
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

CHECK_STRING  .STRINGZ "Hello, World!"
CHAR .FILL #108
.END`,
  tests: [
    { description: 'Counts 3 occurrences of "l"', expectedOutput: '3' },
  ],
};

export default project;
