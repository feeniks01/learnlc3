export interface LessonSection {
  type: 'text' | 'code' | 'info' | 'warning' | 'exercise' | 'quiz';
  title?: string;
  content?: string;
  code?: string;
  prompt?: string;
  starter?: string;
  solution?: string;
  tests?: { input?: string; expectedOutput: string; description: string }[];
  question?: string;
  options?: string[];
  correct?: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  title: string;
  category: string;
  description: string;
  sections: LessonSection[];
}

export const categories = [
  'Foundations',
  'Instructions',
  'Memory & Data',
  'Control Flow',
  'I/O & TRAP',
  'Subroutines',
  'Problem Solving',
  'Advanced',
];

export const lessons: Lesson[] = [
  // ── FOUNDATIONS ──────────────────────────────────────
  {
    id: 'welcome',
    title: 'Welcome to LC-3',
    category: 'Foundations',
    description: 'Introduction to the LC-3 architecture and why we learn assembly.',
    sections: [
      {
        type: 'text',
        content: `## What is the LC-3?

The **LC-3** (Little Computer 3) is a simplified computer architecture designed for teaching. Despite its simplicity, it has all the essential features of real processors — registers, memory, an ALU, and a full instruction set.

Learning LC-3 assembly gives you a deep understanding of how computers actually execute programs. Every high-level language — Python, JavaScript, C — eventually becomes machine instructions like these.

## Architecture Overview

The LC-3 has:

- **Memory**: 65,536 locations (2^16), each storing a 16-bit value
- **8 General-Purpose Registers**: R0 through R7, each 16 bits wide
- **Program Counter (PC)**: Points to the next instruction to execute
- **Condition Codes**: Three flags — N (negative), Z (zero), P (positive) — set by most instructions
- **15 Instructions**: That's it. Everything a computer does comes from just 15 operations.`
      },
      {
        type: 'info',
        content: 'Every LC-3 instruction is exactly 16 bits. The top 4 bits specify the **opcode** (which instruction), and the remaining 12 bits encode the operands.'
      },
      {
        type: 'text',
        content: `## The Instruction Categories

LC-3 instructions fall into three groups:

- **Operate**: \`ADD\`, \`AND\`, \`NOT\` — arithmetic and logic on registers
- **Data Movement**: \`LD\`, \`LDI\`, \`LDR\`, \`LEA\`, \`ST\`, \`STI\`, \`STR\` — move data between registers and memory
- **Control**: \`BR\`, \`JMP\`, \`JSR\`, \`JSRR\`, \`RET\`, \`TRAP\` — change the flow of execution

## Your First Program

Here's the simplest LC-3 program — it halts immediately:`
      },
      {
        type: 'code',
        code: `.ORIG x3000    ; Program starts at address x3000
HALT           ; Stop execution
.END           ; End of source`
      },
      {
        type: 'text',
        content: `Every program starts with \`.ORIG\` (the starting memory address) and ends with \`.END\`. The \`HALT\` instruction (actually TRAP x25) tells the computer to stop.`
      },
      {
        type: 'quiz',
        question: 'How many general-purpose registers does the LC-3 have?',
        options: ['4', '8', '16', '32'],
        correct: 1,
        explanation: 'The LC-3 has 8 general-purpose registers: R0 through R7. Each is 16 bits wide.'
      }
    ]
  },

  {
    id: 'number-systems',
    title: 'Number Systems',
    category: 'Foundations',
    description: 'Binary, hexadecimal, and two\'s complement representation.',
    sections: [
      {
        type: 'text',
        content: `## Binary and Hexadecimal

Computers operate in **binary** (base 2). Each digit is a 0 or 1, called a **bit**. In LC-3, everything is 16 bits wide.

**Hexadecimal** (base 16) is a convenient shorthand — each hex digit represents exactly 4 bits:

| Hex | Binary | Decimal |
|-----|--------|---------|
| 0   | 0000   | 0       |
| 5   | 0101   | 5       |
| A   | 1010   | 10      |
| F   | 1111   | 15      |

So \`x3000\` = \`0011 0000 0000 0000\` in binary = 12288 in decimal.

## Two's Complement

LC-3 uses **two's complement** to represent signed integers. In a 16-bit system:

- Positive numbers: \`0000 0000 0000 0001\` = 1
- Negative numbers: flip all bits and add 1
- \`-1\` = \`1111 1111 1111 1111\` = \`xFFFF\`
- Range: -32768 to 32767

To negate a number: **invert all bits, then add 1**.

For example, to get -5:
- 5 = \`0000 0000 0000 0101\`
- Invert: \`1111 1111 1111 1010\`
- Add 1: \`1111 1111 1111 1011\` = \`xFFFB\``
      },
      {
        type: 'info',
        content: 'In LC-3 assembly, prefix numbers with **#** for decimal (\`#-5\`), **x** for hex (\`xFF\`), or **b** for binary (\`b1010\`).'
      },
      {
        type: 'quiz',
        question: 'What is the 16-bit two\'s complement representation of -1?',
        options: ['x0001', 'xFFFF', 'x8001', 'x7FFF'],
        correct: 1,
        explanation: '-1 in two\'s complement: invert all bits of 1 (xFFFE) and add 1 = xFFFF. All bits are 1.'
      },
      {
        type: 'quiz',
        question: 'What decimal value does x800F represent in 16-bit two\'s complement?',
        options: ['32783', '-32753', '-32767', '32769'],
        correct: 1,
        explanation: 'The MSB is 1, so it\'s negative. x800F = -(x7FF1) = -(32753). Compute: invert bits = x7FF0, add 1 = x7FF1 = 32753, negate = -32753.'
      }
    ]
  },

  {
    id: 'registers-memory',
    title: 'Registers & Memory',
    category: 'Foundations',
    description: 'Understanding registers, memory layout, and the fetch-execute cycle.',
    sections: [
      {
        type: 'text',
        content: `## Registers

Registers are small, fast storage locations inside the CPU. The LC-3 has:

- **R0–R7**: General-purpose registers. You use these for all your computations.
- **PC**: The Program Counter — holds the address of the next instruction.
- **CC**: Condition Codes (N, Z, P) — set automatically by certain instructions.

Registers are **much faster** than memory. Most instructions work directly with registers.

## Memory Layout

LC-3 memory is organized as 65,536 (2^16) locations, each holding a 16-bit value:

| Address Range | Purpose |
|--------------|---------|
| x0000–x00FF | Trap vector table |
| x0100–x01FF | Interrupt vector table |
| x0200–x2FFF | Operating system |
| x3000–xFDFF | **User program space** |
| xFE00–xFFFF | Device registers (I/O) |

Your programs start at \`x3000\` — that's why \`.ORIG x3000\` is the standard.

## The Fetch-Execute Cycle

Every instruction goes through these phases:

1. **FETCH**: Read the instruction at \`memory[PC]\`, then \`PC = PC + 1\`
2. **DECODE**: Determine the opcode and operands
3. **EVALUATE ADDRESS**: Compute any memory addresses needed
4. **FETCH OPERANDS**: Read register/memory values
5. **EXECUTE**: Perform the operation
6. **STORE RESULT**: Write the result to a register or memory`
      },
      {
        type: 'warning',
        content: 'The PC is incremented during FETCH, **before** the instruction executes. This matters for PC-relative addressing — offsets are relative to the already-incremented PC.'
      },
      {
        type: 'quiz',
        question: 'When a PC-relative instruction at address x3005 is executing, what value does the PC hold?',
        options: ['x3004', 'x3005', 'x3006', 'x3007'],
        correct: 2,
        explanation: 'The PC is incremented during the FETCH phase. By the time the instruction at x3005 executes, PC = x3006.'
      }
    ]
  },

  // ── INSTRUCTIONS ────────────────────────────────────
  {
    id: 'add-and',
    title: 'ADD & AND',
    category: 'Instructions',
    description: 'The arithmetic and logical operate instructions.',
    sections: [
      {
        type: 'text',
        content: `## ADD Instruction

\`ADD\` is the LC-3's only arithmetic instruction. It has two modes:

**Register mode**: \`ADD DR, SR1, SR2\`
- Adds the values in SR1 and SR2, stores result in DR

**Immediate mode**: \`ADD DR, SR1, #imm5\`
- Adds SR1 and a small constant (range: -16 to 15), stores in DR
- The 5-bit immediate is sign-extended to 16 bits`
      },
      {
        type: 'code',
        code: `; Register mode
ADD R2, R0, R1    ; R2 = R0 + R1

; Immediate mode
ADD R3, R3, #1    ; R3 = R3 + 1 (increment)
ADD R4, R4, #-1   ; R4 = R4 - 1 (decrement)

; Copy a register
ADD R1, R0, #0    ; R1 = R0 + 0 = R0`
      },
      {
        type: 'text',
        content: `## AND Instruction

\`AND\` performs bitwise AND. Same two modes as ADD:

**Register mode**: \`AND DR, SR1, SR2\`
**Immediate mode**: \`AND DR, SR1, #imm5\``
      },
      {
        type: 'code',
        code: `; Clear a register (very common pattern!)
AND R0, R0, #0    ; R0 = R0 & 0 = 0

; Mask the lower 4 bits
AND R1, R0, xF    ; Wait... we can't!
; imm5 is only 5 bits, so we'd use:
AND R1, R0, #15   ; R1 = R0 & 0x000F`
      },
      {
        type: 'info',
        content: 'Both ADD and AND set the **condition codes** (N, Z, P) based on the result written to DR. This is important for branching.'
      },
      {
        type: 'text',
        content: `## When Do You Use ADD vs AND?

**ADD** is the workhorse — you'll use it constantly:
- Incrementing counters: \`ADD R1, R1, #1\`
- Decrementing counters: \`ADD R1, R1, #-1\`
- Moving pointers through arrays: \`ADD R1, R1, #1\`
- Copying registers: \`ADD R1, R0, #0\`
- Building up constants: \`ADD R0, R0, #15\`
- Comparing values (by subtracting): \`ADD R2, R0, R1\` (where R1 is negated)

**AND** has one primary use: **clearing a register to zero** with \`AND R0, R0, #0\`. You'll occasionally use it for bit masking, but 90% of the time, AND means "set to zero."`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that sets R0 = 5 and R1 = 4, then stores their sum in R2. Convert the sum to an ASCII digit (add 48) and print it with OUT.',
        starter: `.ORIG x3000
; Clear and set R0 = 5


; Clear and set R1 = 4


; R2 = R0 + R1


; Print R2 as ASCII digit: move to R0, add 48, OUT
; Hint: 48 = 15 + 15 + 15 + 3


HALT
.END`,
        solution: `.ORIG x3000
AND R0, R0, #0
ADD R0, R0, #5
AND R1, R1, #0
ADD R1, R1, #4
ADD R2, R0, R1
ADD R0, R2, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT
.END`,
        tests: [
          { expectedOutput: '9', description: 'Should print "9" (5 + 4 = 9)' }
        ]
      },
      {
        type: 'quiz',
        question: 'What does `AND R3, R3, #0` do?',
        options: ['Sets R3 to its NOT value', 'Sets R3 to 0', 'Does nothing', 'Causes an error'],
        correct: 1,
        explanation: 'ANDing any value with 0 produces 0. This is the standard way to clear a register in LC-3.'
      }
    ]
  },

  {
    id: 'not-subtraction',
    title: 'NOT & Subtraction',
    category: 'Instructions',
    description: 'Bitwise NOT and how to subtract without a SUB instruction.',
    sections: [
      {
        type: 'text',
        content: `## NOT Instruction

\`NOT DR, SR\` — Flips every bit of SR and stores the result in DR.

This is the LC-3's only unary operation.`
      },
      {
        type: 'code',
        code: `NOT R1, R0    ; R1 = bitwise complement of R0
              ; If R0 = x000F (0000000000001111)
              ; then R1 = xFFF0 (1111111111110000)`
      },
      {
        type: 'text',
        content: `## Subtraction via Two's Complement

The LC-3 has no \`SUB\` instruction. But we can subtract using:

**A - B = A + (-B) = A + (NOT B) + 1**

Steps to compute R2 = R0 - R1:`
      },
      {
        type: 'code',
        code: `NOT R1, R1      ; R1 = ~R1 (one's complement)
ADD R1, R1, #1  ; R1 = ~R1 + 1 = -R1 (two's complement)
ADD R2, R0, R1  ; R2 = R0 + (-R1) = R0 - R1`
      },
      {
        type: 'warning',
        content: 'This **destroys** the original value of R1. If you need R1 later, copy it to a temporary register first.'
      },
      {
        type: 'info',
        content: '**Why subtraction matters so much:** Subtraction is how you **compare** values in LC-3. There is no CMP instruction. To check if R0 equals R1, you subtract and check if the result is zero (BRz). To check if R0 > R1, you subtract and check if positive (BRp). You\'ll use this pattern in almost every program that makes decisions.'
      },
      {
        type: 'text',
        content: `## Logical OR

The LC-3 also has no \`OR\` instruction. We use De Morgan's Law:

**A OR B = NOT(NOT A AND NOT B)**`
      },
      {
        type: 'code',
        code: `; R2 = R0 OR R1
NOT R0, R0      ; R0 = ~R0
NOT R1, R1      ; R1 = ~R1
AND R2, R0, R1  ; R2 = ~R0 & ~R1
NOT R2, R2      ; R2 = ~(~R0 & ~R1) = R0 | R1`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that computes R2 = R0 - R1 where R0 = 20 and R1 = 7. Print the result as a character (it should print the ASCII character for 13... but since 13 is a control character, try R0 = 7, R1 = 2 so the difference is 5. Add #48 to convert to ASCII "5" and print it).',
        starter: `.ORIG x3000
; Set R0 = 7
AND R0, R0, #0
ADD R0, R0, #7

; Set R1 = 2
AND R1, R1, #0
ADD R1, R1, #2

; Compute R2 = R0 - R1


; Convert R2 to ASCII digit (add 48)


; Print the character (move to R0 first, then OUT)


HALT
.END`,
        solution: `.ORIG x3000
AND R0, R0, #0
ADD R0, R0, #7
AND R1, R1, #0
ADD R1, R1, #2
NOT R1, R1
ADD R1, R1, #1
ADD R2, R0, R1
AND R0, R0, #0
ADD R0, R2, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT
.END`,
        tests: [
          { expectedOutput: '5', description: 'Should print "5" (7 - 2 = 5, converted to ASCII)' }
        ]
      }
    ]
  },

  // ── MEMORY & DATA ───────────────────────────────────
  {
    id: 'ld-st-lea',
    title: 'LD, ST & LEA',
    category: 'Memory & Data',
    description: 'PC-relative addressing and loading effective addresses.',
    sections: [
      {
        type: 'text',
        content: `## PC-Relative Addressing

The most common way to access memory in LC-3 is **PC-relative**: the instruction contains a 9-bit signed offset that's added to the current PC.

## LD — Load

\`LD DR, LABEL\` loads the **value at** the labeled memory address into DR.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LD R0, VALUE   ; R0 = memory[address of VALUE] = 42
HALT
VALUE .FILL #42
.END`
      },
      {
        type: 'text',
        content: `## ST — Store

\`ST SR, LABEL\` writes the value in SR **to** the labeled memory address.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
AND R0, R0, #0
ADD R0, R0, #7
ST R0, RESULT    ; memory[RESULT] = 7
HALT
RESULT .FILL #0
.END`
      },
      {
        type: 'text',
        content: `## LEA — Load Effective Address

\`LEA DR, LABEL\` computes the **address** of the label and stores it in DR. It does **NOT** access memory — it just calculates the address.

This is crucial for working with strings and arrays:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LEA R0, HELLO    ; R0 = address of HELLO string
PUTS             ; Print the string at address in R0
HALT
HELLO .STRINGZ "Hello, LC-3!"
.END`
      },
      {
        type: 'info',
        content: 'LEA does **not** read from memory. \`LD R0, X\` loads the **value stored at** X. \`LEA R0, X\` loads the **address of** X into R0.'
      },
      {
        type: 'text',
        content: `## When to Use Each

**LD** — Use when you want the **value** at a label. Loading a number, a constant, or a single data value.
Example: \`LD R0, COUNT\` where COUNT .FILL #10

**ST** — Use when you want to **write** a register's value to a label.
Example: \`ST R0, RESULT\` to save your answer

**LEA** — Use when you need the **address** of something, not its value. Essential for:
- Strings (PUTS needs the address): \`LEA R0, MSG\` then \`PUTS\`
- Setting up a pointer to walk through an array: \`LEA R1, ARRAY\`
- Any time you'll use LDR/STR afterward (you need a base address first)`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that loads two values from memory, adds them, stores the result back to memory, and prints "OK". Use labels DATA1, DATA2, and RESULT.',
        starter: `.ORIG x3000
; Load DATA1 into R0


; Load DATA2 into R1


; Add them, store in R2


; Store R2 to RESULT


; Print "OK"
LEA R0, MSG
PUTS

HALT

DATA1 .FILL #15
DATA2 .FILL #27
RESULT .FILL #0
MSG .STRINGZ "OK"
.END`,
        solution: `.ORIG x3000
LD R0, DATA1
LD R1, DATA2
ADD R2, R0, R1
ST R2, RESULT
LEA R0, MSG
PUTS
HALT
DATA1 .FILL #15
DATA2 .FILL #27
RESULT .FILL #0
MSG .STRINGZ "OK"
.END`,
        tests: [
          { expectedOutput: 'OK', description: 'Should print "OK" after computing 15 + 27 = 42' }
        ]
      },
      {
        type: 'quiz',
        question: 'What is the difference between `LD R0, X` and `LEA R0, X`?',
        options: [
          'They are identical',
          'LD loads the value at X, LEA loads the address of X',
          'LEA loads the value at X, LD loads the address of X',
          'LD is for data, LEA is for instructions'
        ],
        correct: 1,
        explanation: 'LD reads the value stored in memory at that address. LEA computes the address itself without accessing memory.'
      }
    ]
  },

  {
    id: 'ldr-str-ldi-sti',
    title: 'LDR, STR, LDI & STI',
    category: 'Memory & Data',
    description: 'Base+offset and indirect addressing modes.',
    sections: [
      {
        type: 'text',
        content: `## The Problem with PC-Relative

LD and ST use a 9-bit offset, giving a range of only -256 to +255 from the PC. What if your data is further away?

The LC-3 provides two solutions: **base+offset** and **indirect** addressing.

## LDR and STR — Base+Offset

\`LDR DR, BaseR, #offset6\` — Load from \`memory[BaseR + offset]\`
\`STR SR, BaseR, #offset6\` — Store to \`memory[BaseR + offset]\`

The base register holds a full 16-bit address, so you can reach **any** memory location. The 6-bit offset gives a range of -32 to +31 from the base.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LEA R1, ARRAY      ; R1 = address of ARRAY
LDR R0, R1, #0     ; R0 = ARRAY[0] = 10
LDR R2, R1, #1     ; R2 = ARRAY[1] = 20
LDR R3, R1, #2     ; R3 = ARRAY[2] = 30
ADD R0, R0, R2     ; R0 = 10 + 20
ADD R0, R0, R3     ; R0 = 30 + 30 = 60
HALT
ARRAY .FILL #10
      .FILL #20
      .FILL #30
.END`
      },
      {
        type: 'text',
        content: `## LDI and STI — Indirect Addressing

\`LDI DR, LABEL\` — The value at LABEL is treated as an **address**, and the data at *that* address is loaded into DR. It's a double dereference: \`DR = memory[memory[LABEL]]\`.

\`STI SR, LABEL\` — Similarly, stores SR to the address pointed to by the value at LABEL.

Think of it as following a pointer.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LDI R0, PTR     ; R0 = memory[memory[PTR]] = memory[x4000]
HALT
PTR .FILL x4000  ; PTR contains the address x4000
.END`
      },
      {
        type: 'info',
        content: 'Use **LDR/STR** when you have the base address in a register (great for arrays). Use **LDI/STI** when you need to follow a pointer stored in memory.'
      },
      {
        type: 'text',
        content: `## Choosing an Addressing Mode

This is one of the trickiest parts of LC-3. Here's the decision guide:

**"My data is near the PC"** (within ±256 words) → Use **LD/ST** with a label. This is the simplest case — your .FILL or .STRINGZ is right there in the same program.

**"I have a pointer in a register and want to access data through it"** → Use **LDR/STR**. This is what you need for walking arrays and strings. First load the base address into a register (with LEA or LD), then use LDR to read elements at offsets from that base.

**"My data is far away (like x5000) and I don't have the address in a register yet"** → Use **LDI/STI** to go through a pointer. Store the far address in a nearby .FILL, then LDI follows that pointer to reach the distant data. Or use **LD** to load the far address into a register, then switch to **LDR** for repeated access.

For most projects: Load the starting address with \`LD R1, ADDR\` (where ADDR .FILL x5000), then use **LDR** to access individual elements through R1. Store final results with **STI**.`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that uses LDR to sum all 4 elements of an array and prints the sum as an ASCII digit. The array contains {1, 2, 3, 4} so the sum is 10... let\'s use {1, 2, 3, 1} for a sum of 7.',
        starter: `.ORIG x3000
; Point R1 to the array
LEA R1, ARRAY

; Clear R0 for the sum
AND R0, R0, #0

; Load and add each element using LDR


; Convert sum to ASCII (add #48) and print


HALT

ARRAY .FILL #1
      .FILL #2
      .FILL #3
      .FILL #1
.END`,
        solution: `.ORIG x3000
LEA R1, ARRAY
AND R0, R0, #0
LDR R2, R1, #0
ADD R0, R0, R2
LDR R2, R1, #1
ADD R0, R0, R2
LDR R2, R1, #2
ADD R0, R0, R2
LDR R2, R1, #3
ADD R0, R0, R2
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT
ARRAY .FILL #1
      .FILL #2
      .FILL #3
      .FILL #1
.END`,
        tests: [
          { expectedOutput: '7', description: 'Should print "7" (sum of 1+2+3+1 = 7)' }
        ]
      }
    ]
  },

  // ── CONTROL FLOW ────────────────────────────────────
  {
    id: 'branching',
    title: 'Branching (BR)',
    category: 'Control Flow',
    description: 'Conditional and unconditional branches using condition codes.',
    sections: [
      {
        type: 'text',
        content: `## Condition Codes

Every instruction that writes to a register sets the **condition codes**:

- **N** = 1 if the result is negative
- **Z** = 1 if the result is zero
- **P** = 1 if the result is positive

Exactly one of N, Z, P is set at any time. These instructions set CC: ADD, AND, NOT, LD, LDI, LDR, LEA.

## The BR Instruction

\`BR[n][z][p] LABEL\` — Branch to LABEL if the specified condition codes are set.

You specify which flags to check by including n, z, and/or p:`
      },
      {
        type: 'code',
        code: `BRn NEGATIVE    ; Branch if result was negative
BRz ZERO        ; Branch if result was zero
BRp POSITIVE    ; Branch if result was positive
BRnz NOT_POS    ; Branch if negative OR zero
BRnp NOT_ZERO   ; Branch if negative OR positive (not zero)
BRzp NOT_NEG    ; Branch if zero OR positive (not negative)
BRnzp ALWAYS    ; Branch always (unconditional)
BR ALWAYS       ; Same as BRnzp — always branches`
      },
      {
        type: 'text',
        content: `## Example: If-Else

Here's how to implement an if-else in LC-3:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LD R0, X
ADD R0, R0, #0     ; Set CC based on R0 (important!)
BRn IS_NEG         ; if R0 < 0, goto IS_NEG
LEA R0, POS_MSG    ; else: print "Positive"
PUTS
BR DONE            ; skip the negative branch
IS_NEG
LEA R0, NEG_MSG    ; print "Negative"
PUTS
DONE
HALT
X .FILL #5
POS_MSG .STRINGZ "Positive"
NEG_MSG .STRINGZ "Negative"
.END`
      },
      {
        type: 'warning',
        content: 'If you load a value with `LD` or `ADD R0, R0, #0`, the CC is already set. But after operations like `ST`, the CC is **not** updated. Always make sure CC reflects what you want to test before branching.'
      },
      {
        type: 'text',
        content: `## Choosing the Right Branch

The trick is mapping your **high-level condition** to a **CC check**:

| High-Level Condition | Setup | Branch |
|---|---|---|
| if (x == 0) | \`ADD R0, R0, #0\` | \`BRz\` |
| if (x != 0) | \`ADD R0, R0, #0\` | \`BRnp\` |
| if (x > 0) | \`ADD R0, R0, #0\` | \`BRp\` |
| if (x < 0) | \`ADD R0, R0, #0\` | \`BRn\` |
| if (x >= 0) | \`ADD R0, R0, #0\` | \`BRzp\` |
| if (a == b) | subtract a - b | \`BRz\` |
| if (a != b) | subtract a - b | \`BRnp\` |
| if (a > b) | subtract a - b | \`BRp\` |
| always jump | (no setup needed) | \`BRnzp\` or \`BR\` |

The pattern is always the same: **get the value you care about into the condition codes** (by doing an operation that writes to a register), then branch.`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that loads a number from memory. If it\'s zero, print "Z". If positive, print "P". If negative, print "N".',
        starter: `.ORIG x3000
LD R1, NUM
; Hint: LD already sets CC

; Check if zero


; Check if positive


; Must be negative
AND R0, R0, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
BR DONE

IS_POS
AND R0, R0, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #5
OUT
BR DONE

IS_ZERO
AND R0, R0, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
OUT

DONE HALT

NUM .FILL #5
.END`,
        solution: `.ORIG x3000
LD R1, NUM
BRz IS_ZERO
BRp IS_POS
; Negative: print 'N' (ASCII 78 = 15*5 + 3)
AND R0, R0, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
BR DONE
; Positive: print 'P' (ASCII 80 = 15*5 + 5)
IS_POS
AND R0, R0, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #5
OUT
BR DONE
; Zero: print 'Z' (ASCII 90 = 15*6)
IS_ZERO
AND R0, R0, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
OUT
DONE HALT
NUM .FILL #5
.END`,
        tests: [
          { expectedOutput: 'P', description: 'With NUM = 5, should print "P" for positive' }
        ]
      }
    ]
  },

  {
    id: 'loops',
    title: 'Loops',
    category: 'Control Flow',
    description: 'Implementing while loops and for loops with branches.',
    sections: [
      {
        type: 'text',
        content: `## Loops in Assembly

There's no \`for\` or \`while\` in assembly. We build loops with:
1. A counter in a register
2. A branch instruction that jumps back to the top

## Counting Loop Pattern

Here's the classic "count down to zero" loop:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
AND R0, R0, #0    ; R0 = sum = 0
AND R1, R1, #0
ADD R1, R1, #5    ; R1 = counter = 5

LOOP
ADD R1, R1, #0    ; Set CC for R1
BRz DONE          ; If counter == 0, exit loop
ADD R0, R0, R1    ; sum += counter
ADD R1, R1, #-1   ; counter--
BR LOOP           ; Go back to top

DONE HALT          ; R0 = 5+4+3+2+1 = 15
.END`
      },
      {
        type: 'text',
        content: `## Iterating Over an Array

Combine a pointer register with a counter to walk through data:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Sum 5 numbers starting at ARRAY
AND R0, R0, #0      ; R0 = sum
LEA R1, ARRAY       ; R1 = pointer to current element
AND R2, R2, #0
ADD R2, R2, #5      ; R2 = count

LOOP
ADD R2, R2, #0      ; Check counter
BRz DONE
LDR R3, R1, #0      ; R3 = current element
ADD R0, R0, R3      ; sum += element
ADD R1, R1, #1      ; pointer++
ADD R2, R2, #-1     ; count--
BR LOOP

DONE HALT

ARRAY .FILL #3
      .FILL #7
      .FILL #1
      .FILL #4
      .FILL #5
.END`
      },
      {
        type: 'info',
        content: 'The pattern `ADD R2, R2, #0` is a common idiom — it doesn\'t change R2 but **sets the condition codes** so we can branch on its value.'
      },
      {
        type: 'text',
        content: `## Loop Templates

Most loops in LC-3 follow one of these templates:

**Count-down loop** (when you know how many iterations):
\`\`\`
AND counter, counter, #0
ADD counter, counter, #N
LOOP
ADD counter, counter, #0
BRz DONE
; ... body ...
ADD counter, counter, #-1
BR LOOP
DONE
\`\`\`

**Pointer-walk loop** (for strings and arrays):
\`\`\`
LEA ptr, DATA   ; or LD ptr, ADDR
LOOP
LDR char, ptr, #0
BRz DONE        ; null terminator = stop
; ... process char ...
ADD ptr, ptr, #1
BR LOOP
DONE
\`\`\`

**Sentinel loop** (stop when a condition is met):
\`\`\`
LOOP
; ... do something ...
; ... compute a condition ...
BRz DONE        ; or BRn, BRp depending on your stop condition
BR LOOP
DONE
\`\`\`

Recognize which template fits your problem, then fill in the body.`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that counts down from 9 to 1, printing each digit. Output should be "987654321".',
        starter: `.ORIG x3000
AND R1, R1, #0
ADD R1, R1, #9    ; counter = 9

LOOP
; Check if counter is 0


; Convert counter to ASCII digit (add 48)
; Put in R0 and print with OUT


; Decrement counter


; Loop back


DONE HALT
.END`,
        solution: `.ORIG x3000
AND R1, R1, #0
ADD R1, R1, #9
LOOP
ADD R1, R1, #0
BRz DONE
ADD R0, R1, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
ADD R1, R1, #-1
BR LOOP
DONE HALT
.END`,
        tests: [
          { expectedOutput: '987654321', description: 'Should print digits from 9 down to 1' }
        ]
      }
    ]
  },

  {
    id: 'jmp-jsr',
    title: 'JMP, JSR & RET',
    category: 'Control Flow',
    description: 'Unconditional jumps and subroutine calls.',
    sections: [
      {
        type: 'text',
        content: `## JMP — Unconditional Jump

\`JMP BaseR\` — Sets PC to the value in BaseR. Unlike BR which is limited to ±256 addresses, JMP can go **anywhere** since it uses a full 16-bit register value.

## JSR/JSRR — Jump to Subroutine

\`JSR LABEL\` — Saves the return address in R7, then jumps to LABEL.
\`JSRR BaseR\` — Saves the return address in R7, then jumps to the address in BaseR.

The key: **R7 = PC** (the address of the instruction after JSR) before jumping. This is how the subroutine knows where to return.

## RET — Return from Subroutine

\`RET\` is actually just \`JMP R7\` — it returns to the address saved in R7.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Main program
LEA R0, MSG1
PUTS              ; Print "Before"
JSR MY_SUB        ; Call subroutine (R7 = return addr)
LEA R0, MSG3
PUTS              ; Print "After"
HALT

; Subroutine
MY_SUB
  LEA R0, MSG2
  PUTS            ; Print "Inside"
  RET             ; Return to caller (JMP R7)

MSG1 .STRINGZ "Before "
MSG2 .STRINGZ "Inside "
MSG3 .STRINGZ "After"
.END`
      },
      {
        type: 'warning',
        content: 'R7 is the **link register**. JSR overwrites R7 with the return address. If your subroutine calls another subroutine (nested calls), you must **save R7** first or the original return address is lost!'
      },
      {
        type: 'exercise',
        prompt: 'Write a program with a subroutine called DOUBLE that doubles the value in R0. Main should set R0 = 3, call DOUBLE, then print the result (6) as an ASCII character.',
        starter: `.ORIG x3000
; Main: Set R0 = 3
AND R0, R0, #0
ADD R0, R0, #3

; Call DOUBLE


; Convert R0 to ASCII and print


HALT

; Subroutine: DOUBLE
; Input: R0
; Output: R0 = R0 * 2
DOUBLE


.END`,
        solution: `.ORIG x3000
AND R0, R0, #0
ADD R0, R0, #3
JSR DOUBLE
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT
DOUBLE
ADD R0, R0, R0
RET
.END`,
        tests: [
          { expectedOutput: '6', description: 'Should print "6" (3 doubled = 6)' }
        ]
      }
    ]
  },

  // ── I/O & TRAP ──────────────────────────────────────
  {
    id: 'trap-routines',
    title: 'TRAP Routines & I/O',
    category: 'I/O & TRAP',
    description: 'System calls for input and output.',
    sections: [
      {
        type: 'text',
        content: `## TRAP Instructions

TRAP instructions invoke operating system **service routines**. They're the LC-3's way of doing I/O and system operations.

| Trap | Alias | Description |
|------|-------|-------------|
| TRAP x20 | GETC | Read one character into R0 (no echo) |
| TRAP x21 | OUT | Print character in R0 |
| TRAP x22 | PUTS | Print string starting at address in R0 |
| TRAP x23 | IN | Read character into R0 (with echo) |
| TRAP x25 | HALT | Stop the program |

You can use either form: \`TRAP x21\` or \`OUT\` — they're identical.

## Output: Printing Characters

\`OUT\` prints the ASCII character in the low 8 bits of R0:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Print 'A' (ASCII 65)
AND R0, R0, #0
ADD R0, R0, #15   ; 15
ADD R0, R0, #15   ; 30
ADD R0, R0, #15   ; 45
ADD R0, R0, #15   ; 60
ADD R0, R0, #5    ; 65 = 'A'
OUT

; Easier: print a whole string
LEA R0, MSG
PUTS

HALT
MSG .STRINGZ " Hello!"
.END`
      },
      {
        type: 'text',
        content: `## Input: Reading Characters

\`GETC\` reads a single character from the keyboard into R0. \`IN\` does the same but also echoes the character to the screen.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LEA R0, PROMPT
PUTS            ; Print prompt
GETC            ; Read character into R0
OUT             ; Echo it back
LEA R0, NL
PUTS            ; Print newline
HALT
PROMPT .STRINGZ "Type a character: "
NL .STRINGZ "\\n"
.END`
      },
      {
        type: 'exercise',
        prompt: 'Write an "echo" program: read a character from the user (use GETC), then print it 3 times using OUT.',
        starter: `.ORIG x3000
; Read a character


; Print it 3 times


HALT
.END`,
        solution: `.ORIG x3000
GETC
OUT
OUT
OUT
HALT
.END`,
        tests: [
          { input: 'A', expectedOutput: 'AAA', description: 'If input is "A", should print "AAA"' }
        ]
      }
    ]
  },

  // ── SUBROUTINES ─────────────────────────────────────
  {
    id: 'subroutines',
    title: 'Subroutines & the Stack',
    category: 'Subroutines',
    description: 'Writing reusable functions with proper register saving.',
    sections: [
      {
        type: 'text',
        content: `## Callee-Save Convention

When writing a subroutine, you should **save** any registers you'll modify (except the return value) and **restore** them before returning. This way the caller's data is preserved.

The standard approach uses the **stack** — a region of memory managed with R6 as the stack pointer.

## The Stack

The LC-3 stack grows **downward** (toward lower addresses). R6 is the stack pointer by convention.

**Push**: Decrement R6, then store
**Pop**: Load, then increment R6`
      },
      {
        type: 'code',
        code: `; Push R0 onto the stack
ADD R6, R6, #-1    ; Make room
STR R0, R6, #0     ; Store R0 at top of stack

; Pop from stack into R0
LDR R0, R6, #0     ; Load top of stack
ADD R6, R6, #1     ; Shrink stack`
      },
      {
        type: 'text',
        content: `## Complete Subroutine Example

Here's a subroutine that multiplies R0 by R1 using repeated addition:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Initialize stack pointer
LD R6, STACK

; Set up arguments
AND R0, R0, #0
ADD R0, R0, #6    ; R0 = 6
AND R1, R1, #0
ADD R1, R1, #7    ; R1 = 7

; Call MULTIPLY
JSR MULTIPLY

; R0 now contains 42
HALT

;---------------------------
; MULTIPLY: R0 = R0 * R1
; Uses R2 as counter, R3 as accumulator
;---------------------------
MULTIPLY
  ; Save registers
  ADD R6, R6, #-1
  STR R7, R6, #0    ; Save R7 (return address)
  ADD R6, R6, #-1
  STR R2, R6, #0    ; Save R2
  ADD R6, R6, #-1
  STR R3, R6, #0    ; Save R3

  ; R3 = 0 (accumulator), R2 = R1 (counter)
  AND R3, R3, #0
  ADD R2, R1, #0

  MUL_LOOP
    ADD R2, R2, #0
    BRz MUL_DONE
    ADD R3, R3, R0   ; accumulator += R0
    ADD R2, R2, #-1  ; counter--
    BR MUL_LOOP

  MUL_DONE
  ADD R0, R3, #0     ; Result in R0

  ; Restore registers
  LDR R3, R6, #0
  ADD R6, R6, #1
  LDR R2, R6, #0
  ADD R6, R6, #1
  LDR R7, R6, #0
  ADD R6, R6, #1

  RET

STACK .FILL xFE00
.END`
      },
      {
        type: 'info',
        content: 'Always save and restore **R7** in subroutines that call other subroutines (JSR overwrites R7). The stack makes this clean and systematic.'
      },
      {
        type: 'exercise',
        prompt: 'Write a subroutine called ABS that computes the absolute value of R0. If R0 is negative, negate it. If positive or zero, leave it unchanged. The main program should test with R0 = -3 and print the result.',
        starter: `.ORIG x3000
LD R6, STACK

; Set R0 = -3
AND R0, R0, #0
ADD R0, R0, #-3

; Call ABS
JSR ABS

; Convert to ASCII and print
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT

;---------------------------
; ABS: R0 = |R0|
;---------------------------
ABS


STACK .FILL xFE00
.END`,
        solution: `.ORIG x3000
LD R6, STACK
AND R0, R0, #0
ADD R0, R0, #-3
JSR ABS
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT
ABS
ADD R0, R0, #0
BRzp ABS_DONE
NOT R0, R0
ADD R0, R0, #1
ABS_DONE
RET
STACK .FILL xFE00
.END`,
        tests: [
          { expectedOutput: '3', description: 'Should print "3" (absolute value of -3)' }
        ]
      }
    ]
  },

  // ── PROBLEM SOLVING ────────────────────────────────
  {
    id: 'common-patterns',
    title: 'Common Patterns & Idioms',
    category: 'Problem Solving',
    description: 'The reusable building blocks you\'ll combine to solve any LC-3 problem.',
    sections: [
      {
        type: 'text',
        content: `## Why Patterns Matter

You know what ADD, AND, NOT, LD, ST, LEA, LDR, STR, and BR do individually. But when you face a problem like "check if a string is a palindrome," it's hard to know where to start.

The secret: **every LC-3 program is built from a small set of patterns.** Once you recognize them, complex programs become a matter of snapping pieces together.

## Pattern 1: Clear and Initialize a Register

Almost every program starts by clearing registers and loading initial values.`
      },
      {
        type: 'code',
        code: `; Clear a register to 0
AND R0, R0, #0        ; R0 = 0

; Set to a small value (-16 to 15)
AND R1, R1, #0
ADD R1, R1, #7        ; R1 = 7

; Set to a larger value (build it up)
AND R2, R2, #0
ADD R2, R2, #15       ; 15
ADD R2, R2, #15       ; 30
ADD R2, R2, #2        ; 32 (ASCII space)

; Load a value from memory (any size)
LD R3, MY_VALUE       ; R3 = whatever is at MY_VALUE`
      },
      {
        type: 'info',
        content: '**When to use which:** Use `ADD #imm` for values -16 to 15. For larger constants, either chain multiple ADDs or store the value in memory with `.FILL` and use `LD`. Memory is cleaner for values like ASCII codes or addresses.'
      },
      {
        type: 'text',
        content: `## Pattern 2: Copy a Register

You often need the same value in two places. There is no MOV instruction — use ADD with 0.`
      },
      {
        type: 'code',
        code: `; Copy R0 into R1
ADD R1, R0, #0        ; R1 = R0 + 0 = R0`
      },
      {
        type: 'text',
        content: `## Pattern 3: Compare Two Values

This is the **most important pattern** for problem solving. The LC-3 has no CMP instruction — you compare by subtracting and checking the condition codes.`
      },
      {
        type: 'code',
        code: `; Are R0 and R1 equal?
; Strategy: compute R0 - R1, check if zero
NOT R2, R1
ADD R2, R2, #1        ; R2 = -R1
ADD R2, R0, R2        ; R2 = R0 - R1
BRz THEY_ARE_EQUAL    ; branch if R0 == R1
; ... they are not equal ...

; Is R0 > R1?
; Same subtraction, but check positive
NOT R2, R1
ADD R2, R2, #1
ADD R2, R0, R2        ; R2 = R0 - R1
BRp R0_IS_GREATER     ; branch if R0 > R1

; Is R0 a specific value (e.g., ASCII space = 32)?
; Strategy: subtract the constant and check zero
LD R2, NEG_SPACE      ; R2 = -32
ADD R2, R0, R2        ; R2 = R0 - 32
BRz ITS_A_SPACE       ; branch if R0 == 32
; ...
NEG_SPACE .FILL #-32`
      },
      {
        type: 'warning',
        content: 'Subtraction destroys a value! `NOT R1, R1 / ADD R1, R1, #1` overwrites R1. If you need R1 later, do the subtraction into a **temporary register** instead, or save R1 first.'
      },
      {
        type: 'text',
        content: `## Pattern 4: Walk Through a String or Array

Use a pointer register and LDR to visit each element.`
      },
      {
        type: 'code',
        code: `; Walk a null-terminated string
LEA R1, STR           ; R1 = pointer to first character
LOOP
LDR R0, R1, #0        ; R0 = current character
BRz DONE              ; null terminator? stop
; ... do something with R0 ...
ADD R1, R1, #1        ; advance pointer
BR LOOP
DONE`
      },
      {
        type: 'text',
        content: `## Pattern 5: Two-Pointer Technique

Many string/array problems use **two pointers** that move toward each other. This is exactly what palindrome, reverse, and similar problems need.`
      },
      {
        type: 'code',
        code: `; R1 = left pointer (start of data)
; R3 = right pointer (end of data)
;
; Loop while R1 < R3:
TWO_PTR_LOOP
  NOT R4, R1
  ADD R4, R4, #1
  ADD R4, R3, R4      ; R4 = R3 - R1
  BRnz DONE           ; if R3 <= R1, pointers crossed → stop

  LDR R0, R1, #0      ; load left element
  LDR R2, R3, #0      ; load right element
  ; ... compare or swap R0 and R2 ...

  ADD R1, R1, #1      ; left moves right
  ADD R3, R3, #-1     ; right moves left
  BR TWO_PTR_LOOP
DONE`
      },
      {
        type: 'text',
        content: `## Pattern 6: Find the End of a String

Before using a right pointer, you need to find where the string ends.`
      },
      {
        type: 'code',
        code: `; R1 = start of string
; After this, R3 = pointer to last character
ADD R3, R1, #0        ; R3 starts at beginning
FIND_END
LDR R0, R3, #0        ; load character
BRz FOUND_END         ; null? we passed the end
ADD R3, R3, #1        ; keep going
BR FIND_END
FOUND_END
ADD R3, R3, #-1       ; back up to last real character`
      },
      {
        type: 'text',
        content: `## Pattern 7: Skip/Filter Characters

Need to skip spaces, ignore certain characters, or find the next vowel? Load, check, and conditionally advance.`
      },
      {
        type: 'code',
        code: `; Skip spaces going forward (R1 = pointer)
SKIP_FWD
LDR R0, R1, #0            ; load character
LD R4, NEG_SPACE           ; R4 = -32
ADD R4, R0, R4             ; R4 = char - 32
BRnp NOT_SPACE_FWD         ; not a space? continue
ADD R1, R1, #1             ; skip it, advance
BR SKIP_FWD
NOT_SPACE_FWD
; R1 now points to a non-space character

; Skip spaces going backward (R3 = pointer)
SKIP_BACK
LDR R0, R3, #0
LD R4, NEG_SPACE
ADD R4, R0, R4
BRnp NOT_SPACE_BACK
ADD R3, R3, #-1
BR SKIP_BACK
NOT_SPACE_BACK

NEG_SPACE .FILL #-32`
      },
      {
        type: 'text',
        content: `## Pattern 8: Store a Result to Memory

Many projects ask you to put a result at a specific address (like x6000).`
      },
      {
        type: 'code',
        code: `; Store R0 to a nearby label
ST R0, RESULT
RESULT .FILL #0

; Store R0 to a far-away address (like x6000)
STI R0, RESULT_PTR
RESULT_PTR .FILL x6000`
      },
      {
        type: 'info',
        content: '**ST vs STI:** Use `ST` when the target is close (within ±256 of the PC). Use `STI` when the target is far away — STI follows a pointer, so you store the far address in a nearby `.FILL`.'
      },
      {
        type: 'text',
        content: `## Quick Reference: "I need to ___"

| I need to... | Use this pattern |
|---|---|
| Set a register to 0 | \`AND Rx, Rx, #0\` |
| Copy a register | \`ADD Rdst, Rsrc, #0\` |
| Check if two values are equal | Subtract, then \`BRz\` |
| Check if A > B | Subtract (A - B), then \`BRp\` |
| Check if a character is a space | Subtract 32, then \`BRz\` |
| Walk through a string | Pointer + \`LDR\` + \`ADD ptr, ptr, #1\` |
| Find end of string | Walk until \`LDR\` gives null (\`BRz\`) |
| Use two pointers | One at start, one at end, move inward |
| Store result at far address | \`STI\` with a \`.FILL\` pointer |
| Negate a value | \`NOT\` then \`ADD #1\` |
| Build a constant > 15 | Chain \`ADD #15\` or use \`.FILL\` + \`LD\` |`
      },
      {
        type: 'quiz',
        question: 'You need to check if the character in R0 is the letter "A" (ASCII 65). What\'s the best approach?',
        options: [
          'AND R0, R0, #65 then BRz',
          'Load -65 from memory, ADD to R0, then BRz',
          'NOT R0, R0 then BRp',
          'ADD R0, R0, #-65 then BRz'
        ],
        correct: 1,
        explanation: 'You can\'t use AND to compare (that\'s bitwise). You can\'t fit -65 in an imm5 (range is -16 to 15). The correct approach is to store #-65 in memory, load it, add to R0, and branch on zero. Option D would work if -65 fit in 5 bits, but it doesn\'t.'
      },
      {
        type: 'quiz',
        question: 'You have two pointers R1 (left) and R3 (right). How do you check if R1 has passed R3 (i.e., R1 >= R3)?',
        options: [
          'ADD R1, R1, #0 then BRp',
          'Compute R3 - R1, then BRnz (zero or negative means crossed)',
          'Compute R1 - R3, then BRz',
          'AND R1, R3, #0 then BRz'
        ],
        correct: 1,
        explanation: 'Compute R3 - R1. If the result is zero (pointers met) or negative (R1 passed R3), the pointers have crossed. BRnz catches both cases.'
      }
    ]
  },

  {
    id: 'translating-algorithms',
    title: 'Translating Algorithms to LC-3',
    category: 'Problem Solving',
    description: 'A step-by-step method for turning any algorithm into working LC-3 code.',
    sections: [
      {
        type: 'text',
        content: `## The Translation Method

When you face a complex problem (like the palindrome checker), don't try to write assembly from scratch. Use this systematic method:

**Step 1: Write pseudocode** — Solve it in plain English or Python first.
**Step 2: Plan your registers** — Decide what each register holds.
**Step 3: Translate line by line** — Convert each pseudocode line using the patterns you know.
**Step 4: Handle the details** — Add data labels, handle edge cases, set up memory.

Let's walk through this with the **palindrome problem** as a case study.`
      },
      {
        type: 'text',
        content: `## Step 1: Pseudocode

Before touching LC-3, write the solution in a way you understand:

\`\`\`
left = start of string
right = end of string (last character before null)

while left < right:
    if string[left] == space:
        left = left + 1
        continue
    if string[right] == space:
        right = right - 1
        continue
    if string[left] != string[right]:
        result = -1   (not a palindrome)
        stop
    left = left + 1
    right = right - 1

result = 1   (is a palindrome)
\`\`\`

This is the same algorithm whether you implement it in Python or LC-3. The hard part is translating each line.`
      },
      {
        type: 'text',
        content: `## Step 2: Plan Your Registers

Before writing code, assign a job to each register. Write it as a comment at the top of your program.`
      },
      {
        type: 'code',
        code: `; Register plan:
; R1 = left pointer (moves forward)
; R2 = right pointer (moves backward)
; R3 = character loaded from left
; R4 = character loaded from right
; R5 = temporary for comparisons
; R0 = used for storing results`
      },
      {
        type: 'info',
        content: '**Why plan registers?** In high-level languages you name variables freely. In LC-3 you only have 8 registers. Planning prevents you from accidentally overwriting a value you still need.'
      },
      {
        type: 'text',
        content: `## Step 3: Translate Line by Line

Now take each pseudocode line and ask: "Which pattern do I need?"

**Line: \`left = start of string\`**
We need to load the address x5000 into R1. Since x5000 is far from our program, use LD with a .FILL:`
      },
      {
        type: 'code',
        code: `LD R1, STRING_ADDR     ; R1 = x5000 (left pointer)
; ...
STRING_ADDR .FILL x5000`
      },
      {
        type: 'text',
        content: `**Line: \`right = end of string\`**
We need to find the null terminator, then back up one. This is Pattern 6 (Find End of String):`
      },
      {
        type: 'code',
        code: `ADD R2, R1, #0         ; R2 starts at beginning
FIND_END
LDR R5, R2, #0         ; load character at R2
BRz FOUND_END           ; null? done
ADD R2, R2, #1          ; keep looking
BR FIND_END
FOUND_END
ADD R2, R2, #-1         ; back up to last real character`
      },
      {
        type: 'text',
        content: `**Line: \`while left < right:\`**
This is the two-pointer loop condition. Compute R2 - R1 and check if positive (Pattern 5):`
      },
      {
        type: 'code',
        code: `COMPARE_LOOP
NOT R5, R1
ADD R5, R5, #1
ADD R5, R2, R5          ; R5 = R2 - R1 (right - left)
BRnz IS_PALINDROME      ; if right <= left, pointers crossed → palindrome!`
      },
      {
        type: 'text',
        content: `**Line: \`if string[left] == space: left += 1; continue\`**
Load the character, check if it's a space (Pattern 7), and if so, advance and loop back:`
      },
      {
        type: 'code',
        code: `LDR R3, R1, #0          ; R3 = character at left
LD R5, NEG_SPACE         ; R5 = -32
ADD R5, R3, R5           ; R5 = char - 32
BRnp NOT_SPACE_L         ; if not space, continue
ADD R1, R1, #1           ; skip the space
BR COMPARE_LOOP          ; re-check the loop condition
NOT_SPACE_L`
      },
      {
        type: 'text',
        content: `**Line: \`if string[left] != string[right]: result = -1\`**
Compare the two characters (Pattern 3). Subtract one from the other — if not zero, they don't match:`
      },
      {
        type: 'code',
        code: `; R3 already has left char, load right char
LDR R4, R2, #0          ; R4 = character at right

; Compare: R3 - R4
NOT R5, R4
ADD R5, R5, #1
ADD R5, R3, R5           ; R5 = left_char - right_char
BRnp NOT_PALINDROME      ; if not zero, characters don't match!`
      },
      {
        type: 'text',
        content: `**Lines: \`left += 1; right -= 1\`**
Simple pointer movement:`
      },
      {
        type: 'code',
        code: `ADD R1, R1, #1          ; left pointer moves right
ADD R2, R2, #-1         ; right pointer moves left
BR COMPARE_LOOP         ; back to the top`
      },
      {
        type: 'text',
        content: `## Step 4: Handle the Details

Add the result-storing code and data labels:`
      },
      {
        type: 'code',
        code: `IS_PALINDROME
AND R0, R0, #0
ADD R0, R0, #1           ; R0 = 1
STI R0, RESULT_ADDR      ; store 1 at x6000
BR DONE

NOT_PALINDROME
AND R0, R0, #0
ADD R0, R0, #-1          ; R0 = -1 (xFFFF)
STI R0, RESULT_ADDR      ; store -1 at x6000

DONE HALT

STRING_ADDR .FILL x5000
RESULT_ADDR .FILL x6000
NEG_SPACE   .FILL #-32`
      },
      {
        type: 'text',
        content: `## The Complete Program

Putting it all together:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Register plan:
; R1 = left pointer       R2 = right pointer
; R3 = left character      R4 = right character
; R5 = temp for comparisons  R0 = result

; Setup: load string start address
LD R1, STRING_ADDR

; Find end of string
ADD R2, R1, #0
FIND_END
LDR R5, R2, #0
BRz FOUND_END
ADD R2, R2, #1
BR FIND_END
FOUND_END
ADD R2, R2, #-1

; Main comparison loop
COMPARE_LOOP
NOT R5, R1
ADD R5, R5, #1
ADD R5, R2, R5         ; R5 = right - left
BRnz IS_PALINDROME     ; pointers crossed → palindrome

; Skip spaces on left
LDR R3, R1, #0
LD R5, NEG_SPACE
ADD R5, R3, R5
BRnp NOT_SPACE_L
ADD R1, R1, #1
BR COMPARE_LOOP
NOT_SPACE_L

; Skip spaces on right
LDR R4, R2, #0
LD R5, NEG_SPACE
ADD R5, R4, R5
BRnp NOT_SPACE_R
ADD R2, R2, #-1
BR COMPARE_LOOP
NOT_SPACE_R

; Compare characters
NOT R5, R4
ADD R5, R5, #1
ADD R5, R3, R5         ; R5 = left_char - right_char
BRnp NOT_PALINDROME    ; mismatch!

; Advance both pointers
ADD R1, R1, #1
ADD R2, R2, #-1
BR COMPARE_LOOP

IS_PALINDROME
AND R0, R0, #0
ADD R0, R0, #1
STI R0, RESULT_ADDR
BR DONE

NOT_PALINDROME
AND R0, R0, #0
ADD R0, R0, #-1
STI R0, RESULT_ADDR

DONE HALT

STRING_ADDR .FILL x5000
RESULT_ADDR .FILL x6000
NEG_SPACE   .FILL #-32
.END`
      },
      {
        type: 'text',
        content: `## The Translation Checklist

Use this for any problem:

1. **Can I solve this on paper?** Write pseudocode first. If you can't solve it in English, you can't solve it in assembly.
2. **What registers do I need?** List each variable from your pseudocode and assign it a register. If you need more than 7 (R0–R6, with R7 reserved), you'll need to save some to memory.
3. **What patterns does each line use?** Comparison? String walking? Pointer arithmetic? Look at the patterns reference.
4. **Where do my constants come from?** Values outside -16 to 15 need \`.FILL\` + \`LD\`. Far addresses need \`.FILL\` + \`LDI/STI\`.
5. **Did I preserve condition codes?** Every ADD, AND, NOT, LD, LDR, LEA sets the CC. Make sure the CC reflects the right value before each BR.`
      },
      {
        type: 'exercise',
        prompt: 'Translate this pseudocode to LC-3: Read characters until the user types "!" (ASCII 33). Count how many characters were typed (not including the "!"). Print the count as a digit. Assume the count will be 0-9.',
        starter: `.ORIG x3000
; Register plan:
; R1 = counter
; R0 = current character (from GETC)
; R2 = temp for comparison

; Initialize counter
AND R1, R1, #0

; Loop: read a character
READ_LOOP
GETC
OUT                    ; echo the character

; Check if it's '!' (ASCII 33)
; Hint: 33 = 15 + 15 + 3, or use .FILL #-33


; Not '!', so increment counter and loop


; Done! Print the count as ASCII digit


HALT
.END`,
        solution: `.ORIG x3000
AND R1, R1, #0
READ_LOOP
GETC
OUT
LD R2, NEG_BANG
ADD R2, R0, R2
BRz READ_DONE
ADD R1, R1, #1
BR READ_LOOP
READ_DONE
ADD R0, R1, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT
NEG_BANG .FILL #-33
.END`,
        tests: [
          { input: 'hello!', expectedOutput: 'hello!5', description: 'Type "hello!" → 5 characters before "!", should print "5"' }
        ]
      },
      {
        type: 'quiz',
        question: 'You\'re translating `if (a != b) goto FAIL`. R0 = a, R1 = b. Which LC-3 pattern should you use?',
        options: [
          'BRnp FAIL (branch if not positive)',
          'Subtract R0 - R1 into R2, then BRnp FAIL (branch if result is not zero)',
          'AND R0, R1, #0 then BRz FAIL',
          'NOT R0, R0 then ADD R0, R0, R1 then BRz FAIL'
        ],
        correct: 1,
        explanation: 'Subtract a - b: if the result is nonzero (negative or positive), they\'re not equal. BRnp branches when the result is negative OR positive — exactly "not zero."'
      }
    ]
  },

  // ── ADVANCED ────────────────────────────────────────
  {
    id: 'recursion',
    title: 'Recursion',
    category: 'Advanced',
    description: 'Implementing recursive functions in LC-3 assembly.',
    sections: [
      {
        type: 'text',
        content: `## Recursion in Assembly

Recursion works in assembly just like in high-level languages — a function calls itself with a smaller problem. The **stack** is essential because each call needs its own copies of local variables and the return address.

## Factorial Example

Let's implement \`factorial(n)\`:
- Base case: if n <= 1, return 1
- Recursive case: return n * factorial(n-1)

The key insight: before the recursive call, we must **save n and R7** on the stack.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LD R6, STACK      ; Initialize stack

AND R0, R0, #0
ADD R0, R0, #5    ; Compute 5!

JSR FACTORIAL     ; R0 = factorial(5) = 120

HALT

;-----------------------------------
; FACTORIAL: R0 = factorial(R0)
; Input: R0 = n
; Output: R0 = n!
;-----------------------------------
FACTORIAL
  ADD R6, R6, #-1
  STR R7, R6, #0    ; Save return address
  ADD R6, R6, #-1
  STR R1, R6, #0    ; Save R1

  ADD R1, R0, #0    ; R1 = n (save it)

  ADD R0, R0, #-1   ; n - 1
  BRp RECURSE       ; if n-1 > 0, recurse

  ; Base case: return 1
  AND R0, R0, #0
  ADD R0, R0, #1
  BR FACT_DONE

RECURSE
  ; R0 already = n-1
  JSR FACTORIAL     ; R0 = factorial(n-1)

  ; Now multiply: R0 = R1 * R0 (n * factorial(n-1))
  ; Simple multiply using a loop
  ADD R2, R0, #0    ; R2 = factorial(n-1)
  AND R0, R0, #0    ; R0 = 0 (accumulator)
  ADD R1, R1, #0    ; Check R1

  FMUL_LOOP
    ADD R1, R1, #0
    BRz FACT_DONE
    ADD R0, R0, R2
    ADD R1, R1, #-1
    BR FMUL_LOOP

FACT_DONE
  LDR R1, R6, #0    ; Restore R1
  ADD R6, R6, #1
  LDR R7, R6, #0    ; Restore return address
  ADD R6, R6, #1
  RET

STACK .FILL xFE00
.END`
      },
      {
        type: 'info',
        content: 'Each recursive call pushes data onto the stack, and each return pops it off. For factorial(5), the stack grows 5 levels deep before unwinding.'
      },
      {
        type: 'quiz',
        question: 'In a recursive subroutine, what MUST be saved on the stack before making the recursive call?',
        options: [
          'Only local variables',
          'Only R7',
          'R7 and any registers whose values are needed after the call returns',
          'All 8 registers'
        ],
        correct: 2,
        explanation: 'R7 (return address) is overwritten by JSR, so it must be saved. Any register whose value you need after the recursive call returns must also be saved, since the callee might modify it.'
      }
    ]
  },

  {
    id: 'string-processing',
    title: 'String Processing',
    category: 'Advanced',
    description: 'Working with strings: length, comparison, and manipulation.',
    sections: [
      {
        type: 'text',
        content: `## Strings in LC-3

Strings are stored as sequences of ASCII values in consecutive memory locations, terminated by a **null character** (0x0000). The \`.STRINGZ\` directive creates these.

## String Length

Walk through the string until you hit the null terminator, counting characters:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LEA R0, STR
PUTS              ; Print the string

; Compute length
LEA R1, STR       ; R1 = pointer
AND R2, R2, #0    ; R2 = length counter

STRLEN_LOOP
LDR R3, R1, #0    ; Load current char
BRz STRLEN_DONE   ; If null, done
ADD R2, R2, #1    ; length++
ADD R1, R1, #1    ; pointer++
BR STRLEN_LOOP

STRLEN_DONE
; R2 now holds the string length
HALT

STR .STRINGZ "Hello"
.END`
      },
      {
        type: 'text',
        content: `## Character Case Conversion

ASCII uppercase letters are 0x41-0x5A (65-90).
ASCII lowercase letters are 0x61-0x7A (97-122).
The difference is exactly 32 (0x20).

**To lowercase**: OR with 0x20 (set bit 5)
**To uppercase**: AND with 0xDF (clear bit 5)

Since LC-3 doesn't have OR, we use the De Morgan trick or just add/subtract 32.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Convert uppercase to lowercase
; 'A' (65) + 32 = 'a' (97)
LEA R1, STR
LOOP
LDR R0, R1, #0
BRz DONE
; Add 32 to make lowercase
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #2   ; +32
OUT
ADD R1, R1, #1
BR LOOP

DONE HALT
STR .STRINGZ "HELLO"
.END`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that reverses a string. Load the string "ABCDE", reverse it in-place, then print it. Hint: find the length first, then swap characters from the ends toward the middle.',
        starter: `.ORIG x3000
LD R6, STACK
LEA R1, STR

; Step 1: Find length (store in R2)
AND R2, R2, #0
ADD R3, R1, #0
FIND_LEN
LDR R4, R3, #0
BRz FOUND_LEN
ADD R2, R2, #1
ADD R3, R3, #1
BR FIND_LEN
FOUND_LEN

; Step 2: R1 = start pointer, R3 = end pointer (R1 + R2 - 1)
ADD R3, R1, R2
ADD R3, R3, #-1

; Step 3: Swap loop — while R1 < R3
SWAP_LOOP
; ... Your swap code here ...


; Step 4: Print the reversed string
LEA R0, STR
PUTS
HALT

STR .STRINGZ "ABCDE"
STACK .FILL xFE00
.END`,
        solution: `.ORIG x3000
LD R6, STACK
LEA R1, STR
AND R2, R2, #0
ADD R3, R1, #0
FIND_LEN
LDR R4, R3, #0
BRz FOUND_LEN
ADD R2, R2, #1
ADD R3, R3, #1
BR FIND_LEN
FOUND_LEN
ADD R3, R1, R2
ADD R3, R3, #-1
SWAP_LOOP
NOT R4, R1
ADD R4, R4, #1
ADD R4, R4, R3
BRnz SWAP_DONE
LDR R4, R1, #0
LDR R5, R3, #0
STR R5, R1, #0
STR R4, R3, #0
ADD R1, R1, #1
ADD R3, R3, #-1
BR SWAP_LOOP
SWAP_DONE
LEA R0, STR
PUTS
HALT
STR .STRINGZ "ABCDE"
STACK .FILL xFE00
.END`,
        tests: [
          { expectedOutput: 'EDCBA', description: 'Should print "EDCBA" (reverse of "ABCDE")' }
        ]
      }
    ]
  },

  {
    id: 'data-structures',
    title: 'Data Structures',
    category: 'Advanced',
    description: 'Implementing linked lists and stacks in LC-3.',
    sections: [
      {
        type: 'text',
        content: `## Thinking in Data Structures

Even in assembly, we can implement classic data structures. The key is using memory addresses as pointers.

## Stack (Using Memory)

We already saw the hardware stack with R6. Let's formalize it:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
LD R6, STKPTR    ; R6 = stack pointer = xFE00

; Push 5
AND R0, R0, #0
ADD R0, R0, #5
ADD R6, R6, #-1
STR R0, R6, #0

; Push 10
AND R0, R0, #0
ADD R0, R0, #10
ADD R6, R6, #-1
STR R0, R6, #0

; Pop into R1 (should be 10 — LIFO)
LDR R1, R6, #0
ADD R6, R6, #1

; Pop into R2 (should be 5)
LDR R2, R6, #0
ADD R6, R6, #1

HALT
STKPTR .FILL xFE00
.END`
      },
      {
        type: 'text',
        content: `## Linked List

A linked list node has two words: a **value** and a **next pointer**. A null pointer (0) marks the end.`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Walk a linked list and sum all values
LEA R1, HEAD     ; R1 = pointer to first node
AND R0, R0, #0   ; R0 = sum

WALK
ADD R1, R1, #0   ; Check if null
BRz DONE
LDR R2, R1, #0   ; R2 = node.value
ADD R0, R0, R2   ; sum += value
LDR R1, R1, #1   ; R1 = node.next
BR WALK

DONE HALT

; Linked list: 3 -> 7 -> 5 -> null
HEAD .FILL #3        ; Node 1 value   (x3009)
     .FILL x300B     ; Node 1 next -> Node 2
     .FILL #7        ; Node 2 value   (x300B)
     .FILL x300D     ; Node 2 next -> Node 3
     .FILL #5        ; Node 3 value   (x300D)
     .FILL #0        ; Node 3 next -> null
.END`
      },
      {
        type: 'text',
        content: `## Lookup Table

A lookup table maps an index to a value. This is useful for digit-to-ASCII conversion, jump tables, and more:`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Print the digit stored in R0 (0-9)
; Using a lookup table
AND R0, R0, #0
ADD R0, R0, #7    ; R0 = 7

LEA R1, TABLE     ; R1 = base of table
ADD R1, R1, R0    ; R1 = &TABLE[R0]
LDR R0, R1, #0   ; R0 = TABLE[R0] = ASCII '7'
OUT               ; Print it
HALT

TABLE .FILL #48   ; '0'
      .FILL #49   ; '1'
      .FILL #50   ; '2'
      .FILL #51   ; '3'
      .FILL #52   ; '4'
      .FILL #53   ; '5'
      .FILL #54   ; '6'
      .FILL #55   ; '7'
      .FILL #56   ; '8'
      .FILL #57   ; '9'
.END`
      },
      {
        type: 'quiz',
        question: 'In a linked list implementation, how do you detect the end of the list?',
        options: [
          'Check if the value is 0',
          'Count the number of nodes',
          'Check if the next pointer is 0 (null)',
          'Check the condition codes'
        ],
        correct: 2,
        explanation: 'A null pointer (value 0) in the next field indicates the end of the list. We check this by loading the next pointer and branching on zero.'
      }
    ]
  },

  {
    id: 'bit-manipulation',
    title: 'Bit Manipulation',
    category: 'Advanced',
    description: 'Advanced bit tricks with only AND, NOT, and ADD.',
    sections: [
      {
        type: 'text',
        content: `## Bitwise Operations in LC-3

With only AND, NOT, and ADD, we can still perform all common bit operations.

## OR (using De Morgan's Law)

\`A OR B = NOT(NOT(A) AND NOT(B))\``
      },
      {
        type: 'code',
        code: `; R2 = R0 OR R1
NOT R3, R0        ; R3 = ~R0
NOT R4, R1        ; R4 = ~R1
AND R2, R3, R4    ; R2 = ~R0 & ~R1
NOT R2, R2        ; R2 = ~(~R0 & ~R1) = R0 | R1`
      },
      {
        type: 'text',
        content: `## XOR

\`A XOR B = (A AND NOT(B)) OR (NOT(A) AND B)\``
      },
      {
        type: 'code',
        code: `; R2 = R0 XOR R1
NOT R3, R1        ; R3 = ~R1
AND R3, R0, R3    ; R3 = R0 & ~R1
NOT R4, R0        ; R4 = ~R0
AND R4, R4, R1    ; R4 = ~R0 & R1
; Now OR them: R2 = R3 | R4
NOT R3, R3
NOT R4, R4
AND R2, R3, R4
NOT R2, R2        ; R2 = R0 XOR R1`
      },
      {
        type: 'text',
        content: `## Shift Left (Multiply by 2)

LC-3 has no shift instruction, but \`ADD R0, R0, R0\` effectively doubles the value — which is a left shift by 1 bit.`
      },
      {
        type: 'code',
        code: `; Shift R0 left by 3 positions (multiply by 8)
ADD R0, R0, R0    ; R0 << 1
ADD R0, R0, R0    ; R0 << 2
ADD R0, R0, R0    ; R0 << 3`
      },
      {
        type: 'text',
        content: `## Testing a Specific Bit

To check if bit N of R0 is set, AND with a mask that has only bit N set:`
      },
      {
        type: 'code',
        code: `; Test if bit 0 (LSB) of R0 is set
AND R1, R0, #1    ; R1 = R0 & 1
BRp BIT_IS_SET    ; If result > 0, bit was set

; Test if bit 4 is set — need value 16 = 0x10
AND R2, R2, #0
ADD R2, R2, #1
ADD R2, R2, R2    ; 2
ADD R2, R2, R2    ; 4
ADD R2, R2, R2    ; 8
ADD R2, R2, R2    ; 16
AND R1, R0, R2    ; R1 = R0 & 16
BRp BIT4_SET`
      },
      {
        type: 'exercise',
        prompt: 'Write a program that counts the number of 1-bits in a value. Load the value from memory (use x00FF = 255 which has 8 set bits), count the bits, and print the count as a digit.',
        starter: `.ORIG x3000
LD R0, VALUE      ; Load the value
AND R1, R1, #0    ; R1 = bit counter

; Hint: check the LSB with AND R2, R0, #1
; If set, increment counter
; Then shift R0 right... but there's no shift right!
; Alternative: loop 16 times, checking each bit
; Use ADD R0, R0, #0 won't work for shift right
; Try: ADD R0, R0, R0 shifts LEFT, putting the MSB into the sign bit area
; Better approach: AND with 1 to check LSB, then
; we need to "shift right" -- one way is to count all 16 bits
; by checking MSB: ADD R0, R0, #0 sets N if bit 15 is set
; then ADD R0, R0, R0 shifts left

AND R2, R2, #0
ADD R2, R2, #15
ADD R2, R2, #1    ; R2 = 16 (loop counter)

COUNT_LOOP
ADD R2, R2, #0
BRz COUNT_DONE

; Check if MSB (bit 15) is set
ADD R0, R0, #0
BRzp SKIP_INC
ADD R1, R1, #1    ; count++
SKIP_INC

ADD R0, R0, R0    ; Shift left (moves next bit to MSB position)
ADD R2, R2, #-1
BR COUNT_LOOP

COUNT_DONE
; Print R1 as ASCII
ADD R0, R1, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT

VALUE .FILL x00FF
.END`,
        solution: `.ORIG x3000
LD R0, VALUE
AND R1, R1, #0
AND R2, R2, #0
ADD R2, R2, #15
ADD R2, R2, #1
COUNT_LOOP
ADD R2, R2, #0
BRz COUNT_DONE
ADD R0, R0, #0
BRzp SKIP_INC
ADD R1, R1, #1
SKIP_INC
ADD R0, R0, R0
ADD R2, R2, #-1
BR COUNT_LOOP
COUNT_DONE
ADD R0, R1, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
HALT
VALUE .FILL x00FF
.END`,
        tests: [
          { expectedOutput: '8', description: 'x00FF has 8 set bits, should print "8"' }
        ]
      }
    ]
  },

  {
    id: 'sorting',
    title: 'Sorting Algorithms',
    category: 'Advanced',
    description: 'Implementing bubble sort in LC-3 assembly.',
    sections: [
      {
        type: 'text',
        content: `## Bubble Sort in LC-3

Bubble sort repeatedly steps through the array, comparing adjacent elements and swapping them if they're in the wrong order. It's simple to implement in assembly.

**Algorithm:**
1. For i = 0 to n-2:
2. For j = 0 to n-2-i:
3. If array[j] > array[j+1], swap them
4. Repeat until no swaps occur

Let's implement this step by step.

## Comparing Two Numbers

To check if A > B, compute A - B and check if the result is positive:`
      },
      {
        type: 'code',
        code: `; Compare R0 and R1
; If R0 > R1, branch to GREATER
NOT R2, R1
ADD R2, R2, #1     ; R2 = -R1
ADD R2, R0, R2     ; R2 = R0 - R1
BRp GREATER        ; Branch if R0 > R1`
      },
      {
        type: 'text',
        content: `## Full Bubble Sort`
      },
      {
        type: 'code',
        code: `.ORIG x3000
; Bubble sort an array of 5 numbers
LD R6, STACK

AND R5, R5, #0
ADD R5, R5, #4    ; R5 = n-1 = outer loop count

OUTER
ADD R5, R5, #0
BRz PRINT         ; Done sorting

LEA R1, ARRAY     ; R1 = pointer to array start
ADD R4, R5, #0    ; R4 = inner loop count

INNER
ADD R4, R4, #0
BRz NEXT_OUTER

LDR R2, R1, #0    ; R2 = array[j]
LDR R3, R1, #1    ; R3 = array[j+1]

; Compare: if R2 > R3, swap
NOT R0, R3
ADD R0, R0, #1
ADD R0, R2, R0    ; R0 = R2 - R3
BRnz NO_SWAP

; Swap
STR R3, R1, #0
STR R2, R1, #1

NO_SWAP
ADD R1, R1, #1    ; pointer++
ADD R4, R4, #-1   ; inner count--
BR INNER

NEXT_OUTER
ADD R5, R5, #-1
BR OUTER

; Print sorted array as digits
PRINT
LEA R1, ARRAY
AND R2, R2, #0
ADD R2, R2, #5

PLOOP
ADD R2, R2, #0
BRz DONE
LDR R0, R1, #0
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #15
ADD R0, R0, #3
OUT
ADD R1, R1, #1
ADD R2, R2, #-1
BR PLOOP

DONE HALT

ARRAY .FILL #5
      .FILL #2
      .FILL #8
      .FILL #1
      .FILL #4

STACK .FILL xFE00
.END`
      },
      {
        type: 'info',
        content: 'Bubble sort is O(n²) but easy to implement. For LC-3 programs with small arrays, this is perfectly fine. The focus is on understanding pointer manipulation and nested loops.'
      }
    ]
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find(l => l.id === id);
}

export function getLessonsByCategory(category: string): Lesson[] {
  return lessons.filter(l => l.category === category);
}

export function getNextLesson(currentId: string): Lesson | undefined {
  const idx = lessons.findIndex(l => l.id === currentId);
  if (idx >= 0 && idx < lessons.length - 1) return lessons[idx + 1];
  return undefined;
}

export function getPrevLesson(currentId: string): Lesson | undefined {
  const idx = lessons.findIndex(l => l.id === currentId);
  if (idx > 0) return lessons[idx - 1];
  return undefined;
}
