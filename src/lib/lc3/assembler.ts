import { AssemblerResult, AssemblerError } from './types';

// Levenshtein distance for typo suggestions
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

const ALL_INSTRUCTIONS = [
  'ADD', 'AND', 'NOT', 'BR', 'BRN', 'BRZ', 'BRP', 'BRNZ', 'BRNP', 'BRZP', 'BRNZP',
  'LD', 'LDI', 'LDR', 'LEA', 'ST', 'STI', 'STR',
  'JMP', 'JSR', 'JSRR', 'RET', 'RTI', 'NOP',
  'TRAP', 'GETC', 'OUT', 'PUTS', 'IN', 'PUTSP', 'HALT',
];

const RESERVED_NAMES = new Set([
  ...ALL_INSTRUCTIONS,
  'R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7',
  '.ORIG', '.END', '.FILL', '.BLKW', '.STRINGZ',
]);

function suggestInstruction(unknown: string): string {
  let bestMatch = '';
  let bestDist = Infinity;
  for (const instr of ALL_INSTRUCTIONS) {
    const dist = levenshtein(unknown.toUpperCase(), instr);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = instr;
    }
  }
  if (bestDist <= 2) return ` (did you mean '${bestMatch}'?)`;
  return '';
}

const OPCODES: Record<string, number> = {
  BR: 0b0000, BRN: 0b0000, BRZ: 0b0000, BRP: 0b0000,
  BRNZ: 0b0000, BRNP: 0b0000, BRZP: 0b0000, BRNZP: 0b0000,
  ADD: 0b0001, AND: 0b0101, NOT: 0b1001,
  LD: 0b0010, LDI: 0b1010, LDR: 0b0110, LEA: 0b1110,
  ST: 0b0011, STI: 0b1011, STR: 0b0111,
  JMP: 0b1100, JSR: 0b0100, JSRR: 0b0100,
  RET: 0b1100, RTI: 0b1000,
  TRAP: 0b1111,
  GETC: 0b1111, OUT: 0b1111, PUTS: 0b1111,
  IN: 0b1111, PUTSP: 0b1111, HALT: 0b1111,
};

const TRAP_ALIASES: Record<string, number> = {
  GETC: 0x20, OUT: 0x21, PUTS: 0x22, IN: 0x23, PUTSP: 0x24, HALT: 0x25,
};

function parseRegister(s: string): number {
  const match = s.match(/^[Rr]([0-7])$/);
  if (!match) return -1;
  return parseInt(match[1]);
}

function parseNumber(s: string): number | null {
  s = s.trim();
  if (s.startsWith('#')) {
    return parseInt(s.slice(1), 10);
  } else if (s.startsWith('x') || s.startsWith('X')) {
    return parseInt(s.slice(1), 16);
  } else if (s.startsWith('0x') || s.startsWith('0X')) {
    return parseInt(s.slice(2), 16);
  } else if (s.startsWith('b') || s.startsWith('B')) {
    return parseInt(s.slice(1), 2);
  }
  const val = parseInt(s, 10);
  if (!isNaN(val)) return val;
  return null;
}

function signExtend(val: number, bits: number): number {
  const mask = 1 << (bits - 1);
  return (val ^ mask) - mask;
}

function fitsBits(val: number, bits: number): boolean {
  const min = -(1 << (bits - 1));
  const max = (1 << (bits - 1)) - 1;
  return val >= min && val <= max;
}

function fitsUnsigned(val: number, bits: number): boolean {
  return val >= 0 && val < (1 << bits);
}

function stringzLength(raw: string): number {
  let len = 0;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\' && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next === 'n' || next === 't' || next === '\\' || next === '"' || next === '0') {
        i++; // skip escaped character
      }
    }
    len++;
  }
  return len;
}

function toUint16(val: number): number {
  return val & 0xFFFF;
}

interface ParsedLine {
  label: string | null;
  opcode: string | null;
  operands: string[];
  originalLine: number;
  raw: string;
}

function tokenize(source: string): ParsedLine[] {
  const lines = source.split('\n');
  const parsed: ParsedLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Remove comments
    const commentIdx = line.indexOf(';');
    if (commentIdx !== -1) line = line.substring(0, commentIdx);
    line = line.trim();
    if (line.length === 0) {
      parsed.push({ label: null, opcode: null, operands: [], originalLine: i + 1, raw: lines[i] });
      continue;
    }

    let label: string | null = null;
    let opcode: string | null = null;
    let operands: string[] = [];

    // Handle .STRINGZ specially because of quoted strings
    const stringzMatch = line.match(/^(\w+:?\s+)?\.STRINGZ\s+"(.*)"\s*$/i);
    if (stringzMatch) {
      const prefix = (stringzMatch[1] || '').trim();
      if (prefix.endsWith(':')) {
        label = prefix.slice(0, -1);
      } else if (prefix && !prefix.startsWith('.') && !(prefix.toUpperCase() in OPCODES)) {
        label = prefix;
      }
      opcode = '.STRINGZ';
      operands = [stringzMatch[2]];
      parsed.push({ label, opcode, operands, originalLine: i + 1, raw: lines[i] });
      continue;
    }

    // Split tokens by whitespace and commas
    const tokens: string[] = [];
    let current = '';
    let inQuote = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        inQuote = !inQuote;
        current += ch;
      } else if (!inQuote && (ch === ' ' || ch === '\t' || ch === ',')) {
        if (current.length > 0) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
    if (current.length > 0) tokens.push(current);

    if (tokens.length === 0) {
      parsed.push({ label: null, opcode: null, operands: [], originalLine: i + 1, raw: lines[i] });
      continue;
    }

    let tokenIdx = 0;

    // Check if first token is a label
    const first = tokens[0];
    const firstUpper = first.toUpperCase().replace(/:$/, '');

    const isDirective = firstUpper.startsWith('.');
    const isOpcode = firstUpper in OPCODES;

    if (!isDirective && !isOpcode) {
      label = first.replace(/:$/, '');
      tokenIdx = 1;
    }

    if (tokenIdx < tokens.length) {
      opcode = tokens[tokenIdx].toUpperCase().replace(/:$/, '');
      tokenIdx++;
      operands = tokens.slice(tokenIdx);
    }

    parsed.push({ label, opcode, operands, originalLine: i + 1, raw: lines[i] });
  }

  return parsed;
}

export function assemble(source: string): AssemblerResult {
  const errors: AssemblerError[] = [];
  const symbolTable = new Map<string, number>();
  const sourceMap = new Map<number, number>();

  const lines = tokenize(source);

  // Pass 1: Build symbol table
  let origin = 0x3000;
  let address = origin;
  let foundOrig = false;
  let foundEnd = false;

  for (const line of lines) {
    if (foundEnd) break;
    if (!line.opcode) {
      if (line.label) {
        symbolTable.set(line.label.toUpperCase(), address);
      }
      continue;
    }

    const op = line.opcode;

    if (op === '.ORIG') {
      const val = parseNumber(line.operands[0]);
      if (val === null) {
        errors.push({ line: line.originalLine, message: 'Invalid .ORIG value' });
      } else {
        origin = val;
        address = val;
      }
      foundOrig = true;
      if (line.label) symbolTable.set(line.label.toUpperCase(), address);
      continue;
    }

    if (op === '.END') {
      foundEnd = true;
      continue;
    }

    if (!foundOrig) {
      errors.push({ line: line.originalLine, message: 'Instruction before .ORIG' });
      continue;
    }

    if (line.label) {
      const labelUpper = line.label.toUpperCase();
      if (symbolTable.has(labelUpper)) {
        errors.push({ line: line.originalLine, message: `Duplicate label: ${line.label}` });
      } else if (RESERVED_NAMES.has(labelUpper)) {
        errors.push({ line: line.originalLine, message: `Label '${line.label}' conflicts with a reserved name` });
      } else {
        symbolTable.set(labelUpper, address);
      }
    }

    if (op === '.FILL') {
      address++;
    } else if (op === '.BLKW') {
      const val = parseNumber(line.operands[0]);
      address += val || 1;
    } else if (op === '.STRINGZ') {
      address += stringzLength(line.operands[0] || '') + 1; // processed string + null terminator
    } else {
      address++;
    }
  }

  if (errors.length > 0) {
    return { origin, machineCode: [], symbolTable, errors, sourceMap };
  }

  // Pass 2: Generate machine code
  const machineCode: number[] = [];
  address = origin;
  foundEnd = false;
  foundOrig = false;

  for (const line of lines) {
    if (foundEnd) break;
    const op = line.opcode;
    if (!op) continue;

    if (op === '.ORIG') {
      foundOrig = true;
      continue;
    }
    if (op === '.END') {
      foundEnd = true;
      continue;
    }
    if (!foundOrig) continue;

    sourceMap.set(address, line.originalLine);

    try {
      if (op === '.FILL') {
        let val = parseNumber(line.operands[0]);
        if (val === null) {
          // Could be a label
          const labelAddr = symbolTable.get(line.operands[0].toUpperCase());
          if (labelAddr !== undefined) {
            val = labelAddr;
          } else {
            errors.push({ line: line.originalLine, message: `Unknown label: ${line.operands[0]}` });
            val = 0;
          }
        }
        machineCode.push(toUint16(val));
        address++;
      } else if (op === '.BLKW') {
        const count = parseNumber(line.operands[0]) || 1;
        for (let i = 0; i < count; i++) {
          machineCode.push(0);
          if (i > 0) sourceMap.set(address, line.originalLine);
          address++;
        }
        continue; // skip address++ at bottom
      } else if (op === '.STRINGZ') {
        const str = line.operands[0] || '';
        for (let i = 0; i < str.length; i++) {
          let charCode = str.charCodeAt(i);
          // Handle escape sequences
          if (str[i] === '\\' && i + 1 < str.length) {
            const next = str[i + 1];
            if (next === 'n') { charCode = 10; i++; }
            else if (next === 't') { charCode = 9; i++; }
            else if (next === '\\') { charCode = 92; i++; }
            else if (next === '"') { charCode = 34; i++; }
            else if (next === '0') { charCode = 0; i++; }
          }
          machineCode.push(charCode);
          address++;
        }
        machineCode.push(0); // null terminator
        address++;
        continue;
      } else {
        const instr = encodeInstruction(op, line.operands, address, symbolTable, line.originalLine, errors);
        machineCode.push(instr);
        address++;
      }
    } catch (e) {
      errors.push({ line: line.originalLine, message: `Error: ${e}` });
      machineCode.push(0);
      address++;
    }
  }

  return { origin, machineCode, symbolTable, errors, sourceMap };
}

function resolveOffset(operand: string, pc: number, bits: number, symbolTable: Map<string, number>, line: number, errors: AssemblerError[]): number {
  const num = parseNumber(operand);
  if (num !== null) {
    if (!fitsBits(num, bits)) {
      errors.push({ line, message: `Offset ${num} does not fit in ${bits} bits` });
    }
    return num & ((1 << bits) - 1);
  }

  const addr = symbolTable.get(operand.toUpperCase());
  if (addr === undefined) {
    errors.push({ line, message: `Unknown label: ${operand}` });
    return 0;
  }

  const offset = addr - (pc + 1);
  if (!fitsBits(offset, bits)) {
    errors.push({ line, message: `Label "${operand}" is too far away (offset ${offset} doesn't fit in ${bits} bits)` });
  }
  return offset & ((1 << bits) - 1);
}

function encodeInstruction(
  op: string,
  operands: string[],
  address: number,
  symbolTable: Map<string, number>,
  line: number,
  errors: AssemblerError[]
): number {
  const pc = address; // PC is at current address, will be incremented before eval

  switch (op) {
    case 'ADD':
    case 'AND': {
      const opcode = op === 'ADD' ? 0b0001 : 0b0101;
      const dr = parseRegister(operands[0]);
      const sr1 = parseRegister(operands[1]);
      if (dr < 0 || sr1 < 0) {
        errors.push({ line, message: `Invalid register in ${op}` });
        return 0;
      }

      const third = operands[2];
      const sr2 = parseRegister(third);
      if (sr2 >= 0) {
        return (opcode << 12) | (dr << 9) | (sr1 << 6) | (0 << 5) | sr2;
      } else {
        const imm = parseNumber(third);
        if (imm === null) {
          errors.push({ line, message: `Invalid operand: ${third}` });
          return 0;
        }
        if (!fitsBits(imm, 5)) {
          errors.push({ line, message: `Immediate value ${imm} doesn't fit in 5 bits` });
        }
        return (opcode << 12) | (dr << 9) | (sr1 << 6) | (1 << 5) | (imm & 0x1F);
      }
    }

    case 'NOT': {
      const dr = parseRegister(operands[0]);
      const sr = parseRegister(operands[1]);
      if (dr < 0 || sr < 0) {
        errors.push({ line, message: 'Invalid register in NOT' });
        return 0;
      }
      return (0b1001 << 12) | (dr << 9) | (sr << 6) | 0x3F;
    }

    case 'BR': case 'BRN': case 'BRZ': case 'BRP':
    case 'BRNZ': case 'BRNP': case 'BRZP': case 'BRNZP': {
      let n = 0, z = 0, p = 0;
      const flags = op.substring(2).toUpperCase();
      if (flags === '' || flags.includes('N')) n = 1;
      if (flags === '' || flags.includes('Z')) z = 1;
      if (flags === '' || flags.includes('P')) p = 1;
      // BR with no flags = BRnzp (unconditional)
      if (flags === '') { n = 1; z = 1; p = 1; }

      const offset = resolveOffset(operands[0], pc, 9, symbolTable, line, errors);
      return (0b0000 << 12) | (n << 11) | (z << 10) | (p << 9) | offset;
    }

    case 'JMP': {
      const baseR = parseRegister(operands[0]);
      if (baseR < 0) {
        errors.push({ line, message: 'Invalid register in JMP' });
        return 0;
      }
      return (0b1100 << 12) | (baseR << 6);
    }

    case 'RET': {
      return (0b1100 << 12) | (7 << 6); // JMP R7
    }

    case 'JSR': {
      const offset = resolveOffset(operands[0], pc, 11, symbolTable, line, errors);
      return (0b0100 << 12) | (1 << 11) | offset;
    }

    case 'JSRR': {
      const baseR = parseRegister(operands[0]);
      if (baseR < 0) {
        errors.push({ line, message: 'Invalid register in JSRR' });
        return 0;
      }
      return (0b0100 << 12) | (0 << 11) | (baseR << 6);
    }

    case 'LD': case 'LDI': case 'LEA': case 'ST': case 'STI': {
      const opcodeMap: Record<string, number> = {
        LD: 0b0010, LDI: 0b1010, LEA: 0b1110, ST: 0b0011, STI: 0b1011,
      };
      const opcode = opcodeMap[op];
      const reg = parseRegister(operands[0]);
      if (reg < 0) {
        errors.push({ line, message: `Invalid register in ${op}` });
        return 0;
      }
      const offset = resolveOffset(operands[1], pc, 9, symbolTable, line, errors);
      return (opcode << 12) | (reg << 9) | offset;
    }

    case 'LDR': case 'STR': {
      const opcode = op === 'LDR' ? 0b0110 : 0b0111;
      const reg = parseRegister(operands[0]);
      const baseR = parseRegister(operands[1]);
      if (reg < 0 || baseR < 0) {
        errors.push({ line, message: `Invalid register in ${op}` });
        return 0;
      }
      const imm = parseNumber(operands[2]);
      if (imm === null) {
        errors.push({ line, message: `Invalid offset in ${op}` });
        return 0;
      }
      if (!fitsBits(imm, 6)) {
        errors.push({ line, message: `Offset ${imm} doesn't fit in 6 bits` });
      }
      return (opcode << 12) | (reg << 9) | (baseR << 6) | (imm & 0x3F);
    }

    case 'TRAP': {
      const vec = parseNumber(operands[0]);
      if (vec === null || !fitsUnsigned(vec, 8)) {
        errors.push({ line, message: 'Invalid trap vector' });
        return 0;
      }
      return (0b1111 << 12) | (vec & 0xFF);
    }

    case 'GETC': return (0b1111 << 12) | 0x20;
    case 'OUT': return (0b1111 << 12) | 0x21;
    case 'PUTS': return (0b1111 << 12) | 0x22;
    case 'IN': return (0b1111 << 12) | 0x23;
    case 'PUTSP': return (0b1111 << 12) | 0x24;
    case 'HALT': return (0b1111 << 12) | 0x25;

    case 'RTI': return 0b1000 << 12;

    case 'NOP': return 0; // BR with no conditions

    default:
      errors.push({ line, message: `Unknown instruction: ${op}${suggestInstruction(op)}` });
      return 0;
  }
}

export function disassemble(instruction: number, address: number): string {
  const opcode = (instruction >> 12) & 0xF;
  const dr = (instruction >> 9) & 0x7;
  const sr1 = (instruction >> 6) & 0x7;

  switch (opcode) {
    case 0b0001: { // ADD
      if ((instruction >> 5) & 1) {
        const imm5 = signExtend(instruction & 0x1F, 5);
        return `ADD R${dr}, R${sr1}, #${imm5}`;
      } else {
        const sr2 = instruction & 0x7;
        return `ADD R${dr}, R${sr1}, R${sr2}`;
      }
    }
    case 0b0101: { // AND
      if ((instruction >> 5) & 1) {
        const imm5 = signExtend(instruction & 0x1F, 5);
        return `AND R${dr}, R${sr1}, #${imm5}`;
      } else {
        const sr2 = instruction & 0x7;
        return `AND R${dr}, R${sr1}, R${sr2}`;
      }
    }
    case 0b1001: { // NOT
      return `NOT R${dr}, R${sr1}`;
    }
    case 0b0000: { // BR
      const n = (instruction >> 11) & 1;
      const z = (instruction >> 10) & 1;
      const p = (instruction >> 9) & 1;
      const offset = signExtend(instruction & 0x1FF, 9);
      let flags = '';
      if (n) flags += 'n';
      if (z) flags += 'z';
      if (p) flags += 'p';
      if (!flags) return 'NOP';
      return `BR${flags} x${toHex(address + 1 + offset)}`;
    }
    case 0b0010: { // LD
      const offset = signExtend(instruction & 0x1FF, 9);
      return `LD R${dr}, x${toHex(address + 1 + offset)}`;
    }
    case 0b1010: { // LDI
      const offset = signExtend(instruction & 0x1FF, 9);
      return `LDI R${dr}, x${toHex(address + 1 + offset)}`;
    }
    case 0b0110: { // LDR
      const offset = signExtend(instruction & 0x3F, 6);
      return `LDR R${dr}, R${sr1}, #${offset}`;
    }
    case 0b1110: { // LEA
      const offset = signExtend(instruction & 0x1FF, 9);
      return `LEA R${dr}, x${toHex(address + 1 + offset)}`;
    }
    case 0b0011: { // ST
      const offset = signExtend(instruction & 0x1FF, 9);
      return `ST R${dr}, x${toHex(address + 1 + offset)}`;
    }
    case 0b1011: { // STI
      const offset = signExtend(instruction & 0x1FF, 9);
      return `STI R${dr}, x${toHex(address + 1 + offset)}`;
    }
    case 0b0111: { // STR
      const offset = signExtend(instruction & 0x3F, 6);
      return `STR R${dr}, R${sr1}, #${offset}`;
    }
    case 0b1100: { // JMP/RET
      if (sr1 === 7) return 'RET';
      return `JMP R${sr1}`;
    }
    case 0b0100: { // JSR/JSRR
      if ((instruction >> 11) & 1) {
        const offset = signExtend(instruction & 0x7FF, 11);
        return `JSR x${toHex(address + 1 + offset)}`;
      } else {
        return `JSRR R${sr1}`;
      }
    }
    case 0b1111: { // TRAP
      const vec = instruction & 0xFF;
      const names: Record<number, string> = {
        0x20: 'GETC', 0x21: 'OUT', 0x22: 'PUTS',
        0x23: 'IN', 0x24: 'PUTSP', 0x25: 'HALT',
      };
      return names[vec] || `TRAP x${vec.toString(16).toUpperCase()}`;
    }
    case 0b1000: return 'RTI';
    default: return `DATA x${toHex(instruction)}`;
  }
}

function toHex(n: number): string {
  return (n & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
