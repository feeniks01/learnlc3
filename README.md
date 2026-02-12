# Learn LC-3

An interactive web app for learning LC-3 assembly programming. Includes structured lessons, a built-in assembler and simulator, and hands-on projects with automated grading.

## Features

- Lessons covering the LC-3 instruction set, memory, I/O, and subroutines
- Browser-based code editor with syntax highlighting
- Assembler and virtual machine that run entirely client-side
- Projects with an autograder to verify your solutions

## Development

```
npm install
npm run dev
```

Open http://localhost:3000.

## Stack

- Next.js, React, TypeScript
- Tailwind CSS v4
- Custom LC-3 assembler and VM in `src/lib/lc3/`
