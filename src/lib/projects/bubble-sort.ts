import { Project } from './types';

const project: Project = {
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
};

export default project;
