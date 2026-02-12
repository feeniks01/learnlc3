import { NextRequest } from 'next/server';

// Simple in-memory rate limiter: max 10 requests per IP per minute
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

const SYSTEM_PROMPT = `You are an expert LC-3 assembly language tutor helping students learn the LC-3 instruction set architecture. You are embedded in an interactive learning application.

## LC-3 Architecture

- 16-bit word-addressable machine
- 8 general-purpose registers: R0-R7
- Program Counter (PC), Condition Codes (N, Z, P)
- 65,536 memory locations (addresses x0000-xFFFF)
- Programs typically start at x3000

## Instruction Set (15 opcodes)

| Opcode | Name | Format |
|--------|------|--------|
| 0000   | BR   | BRnzp PCoffset9 - Branch based on condition codes |
| 0001   | ADD  | ADD DR, SR1, SR2 or ADD DR, SR1, imm5 |
| 0010   | LD   | LD DR, PCoffset9 - Load from PC-relative address |
| 0011   | ST   | ST SR, PCoffset9 - Store to PC-relative address |
| 0100   | JSR  | JSR PCoffset11 or JSRR BaseR - Jump to subroutine |
| 0101   | AND  | AND DR, SR1, SR2 or AND DR, SR1, imm5 |
| 0110   | LDR  | LDR DR, BaseR, offset6 - Load from base+offset |
| 0111   | STR  | STR SR, BaseR, offset6 - Store to base+offset |
| 1000   | RTI  | Return from interrupt |
| 1001   | NOT  | NOT DR, SR - Bitwise complement |
| 1010   | LDI  | LDI DR, PCoffset9 - Load indirect |
| 1011   | STI  | STI SR, PCoffset9 - Store indirect |
| 1100   | JMP  | JMP BaseR (RET = JMP R7) |
| 1110   | LEA  | LEA DR, PCoffset9 - Load effective address |
| 1111   | TRAP | TRAP trapvect8 |

## Condition Codes
N, Z, P are set by any instruction that writes to a register (ADD, AND, NOT, LD, LDI, LDR, LEA).
- N = 1 if result is negative (bit 15 = 1)
- Z = 1 if result is zero
- P = 1 if result is positive (bit 15 = 0, not zero)
Exactly one of N, Z, P is set at any time.

## TRAP Routines
- GETC (x20): Read character into R0
- OUT (x21): Write character in R0 to console
- PUTS (x22): Write string starting at address in R0
- IN (x23): Prompt and read character into R0
- HALT (x25): Stop execution

## Assembler Directives
- .ORIG xNNNN: Set starting address
- .FILL xNNNN or .FILL #N: Store a value
- .BLKW N: Reserve N words of memory
- .STRINGZ "str": Store null-terminated string
- .END: Mark end of program

## Common Patterns
- Clear a register: AND R0, R0, #0
- Copy a register: ADD R1, R0, #0
- Negate (two's complement): NOT R0, R0 then ADD R0, R0, #1
- Subtract: negate then ADD
- Unconditional branch: BRnzp or just BR

## Your Behavior
- Be concise and direct. Students are learning, so explain clearly but do not over-explain.
- Use LC-3 code examples in your responses when helpful.
- When debugging code, point to the specific line and explain the issue.
- If asked about concepts beyond LC-3, briefly explain how they relate back to LC-3.
- Format code blocks with triple backticks.
- Use inline \`code\` for register names, instructions, and hex values.`;

export async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') {
    return new Response(JSON.stringify({ error: 'AI assistant is disabled' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please wait a minute.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages, code } = await req.json();

  const apiMessages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (code) {
    apiMessages.push({
      role: 'user',
      content: `Here is the LC-3 code I'm looking at:\n\`\`\`asm\n${code}\n\`\`\``,
    });
  }

  apiMessages.push(...messages);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-nano-2025-08-07',
      messages: apiMessages,
      stream: true,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return new Response(JSON.stringify({ error: errorText }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // skip malformed JSON lines
              }
            }
          }
        }
      } catch {
        // stream ended
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
