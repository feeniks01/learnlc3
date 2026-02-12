export interface AssemblerResult {
  origin: number;
  machineCode: number[];
  symbolTable: Map<string, number>;
  errors: AssemblerError[];
  sourceMap: Map<number, number>; // address -> source line
}

export interface AssemblerError {
  line: number;
  message: string;
}

export interface VMStats {
  instructionsExecuted: number;
  memoryReads: number;
  memoryWrites: number;
  branchesTaken: number;
  branchesNotTaken: number;
}

export interface VMState {
  registers: Int16Array;
  pc: number;
  cc: { n: boolean; z: boolean; p: boolean };
  memory: Uint16Array;
  halted: boolean;
  output: string;
  instructionsExecuted: number;
  stats: VMStats;
}

export interface Breakpoint {
  address: number;
  enabled: boolean;
}

export enum Opcode {
  BR = 0b0000,
  ADD = 0b0001,
  LD = 0b0010,
  ST = 0b0011,
  JSR = 0b0100,
  AND = 0b0101,
  LDR = 0b0110,
  STR = 0b0111,
  RTI = 0b1000,
  NOT = 0b1001,
  LDI = 0b1010,
  STI = 0b1011,
  JMP = 0b1100,
  RESERVED = 0b1101,
  LEA = 0b1110,
  TRAP = 0b1111,
}

export const TRAP_VECTORS: Record<number, string> = {
  0x20: 'GETC',
  0x21: 'OUT',
  0x22: 'PUTS',
  0x23: 'IN',
  0x24: 'PUTSP',
  0x25: 'HALT',
};

export const REGISTER_NAMES = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7'];
