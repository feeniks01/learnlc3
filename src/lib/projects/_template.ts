/**
 * Project Template
 *
 * To add a new project:
 * 1. Copy this file and rename it to your-project-id.ts
 * 2. Fill in all the fields below
 * 3. Add an import + entry in index.ts
 *
 * Difficulty levels: 'Beginner' | 'Intermediate' | 'Advanced'
 *
 * Test case options:
 *   - input:          String fed to GETC/IN traps
 *   - expectedOutput: Expected console output (from OUT/PUTS traps)
 *   - preloadMemory:  Load values into memory before running (e.g., data at x5000)
 *   - checkMemory:    Verify memory values after execution
 *   - checkRegisters: Verify register values after execution
 */

import { Project } from './types';

const project: Project = {
  id: 'my-project-id',
  title: 'My Project Title',
  difficulty: 'Beginner',
  description: 'One-line description shown in sidebar and project cards.',
  details: `Detailed description shown on the project page. Supports markdown-like formatting.

**Requirements:**
- Requirement 1
- Requirement 2

**Useful instructions:** \`ADD\`, \`AND\`, \`NOT\``,
  hints: [
    'First hint — most general',
    'Second hint — more specific',
    'Third hint — almost gives it away',
  ],
  starter: `.ORIG x3000
; Your code here

HALT
.END`,
  tests: [
    {
      description: 'Describe what this test checks',
      expectedOutput: 'expected console output',
    },
    // Memory-based test example:
    // {
    //   description: 'Processes data at x5000',
    //   preloadMemory: [
    //     { address: 0x5000, value: 42 },
    //   ],
    //   checkMemory: [
    //     { address: 0x6000, value: 84 },
    //   ],
    // },
  ],
};

export default project;
