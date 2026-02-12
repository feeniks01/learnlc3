import { VMState, VMStats, Opcode } from './types';

// Memory-mapped I/O addresses
const KBSR = 0xFE00; // Keyboard status register
const KBDR = 0xFE02; // Keyboard data register
const DSR  = 0xFE04; // Display status register
const DDR  = 0xFE06; // Display data register
const MCR  = 0xFFFE; // Machine control register

function signExtend(val: number, bits: number): number {
  const mask = 1 << (bits - 1);
  val = val & ((1 << bits) - 1);
  return (val ^ mask) - mask;
}

function toInt16(val: number): number {
  val = val & 0xFFFF;
  if (val >= 0x8000) val -= 0x10000;
  return val;
}

export class LC3VM {
  memory: Uint16Array;
  registers: Int16Array;
  pc: number;
  cc: { n: boolean; z: boolean; p: boolean };
  halted: boolean;
  waitingForInput: boolean;
  output: string;
  inputBuffer: string;
  inputCallback: (() => string | null) | null;
  instructionsExecuted: number;
  memoryReads: number;
  memoryWrites: number;
  branchesTaken: number;
  branchesNotTaken: number;

  constructor() {
    this.memory = new Uint16Array(65536);
    this.registers = new Int16Array(8);
    this.pc = 0x3000;
    this.cc = { n: false, z: true, p: false };
    this.halted = false;
    this.waitingForInput = false;
    this.output = '';
    this.inputBuffer = '';
    this.inputCallback = null;
    this.instructionsExecuted = 0;
    this.memoryReads = 0;
    this.memoryWrites = 0;
    this.branchesTaken = 0;
    this.branchesNotTaken = 0;
  }

  reset() {
    this.memory.fill(0);
    this.registers.fill(0);
    this.pc = 0x3000;
    this.cc = { n: false, z: true, p: false };
    this.halted = false;
    this.waitingForInput = false;
    this.output = '';
    this.inputBuffer = '';
    this.instructionsExecuted = 0;
    this.memoryReads = 0;
    this.memoryWrites = 0;
    this.branchesTaken = 0;
    this.branchesNotTaken = 0;
  }

  load(origin: number, machineCode: number[]) {
    this.pc = origin;
    for (let i = 0; i < machineCode.length; i++) {
      this.memory[origin + i] = machineCode[i] & 0xFFFF;
    }
  }

  /** Load code into memory without changing PC (for secondary files). */
  loadAt(origin: number, machineCode: number[]) {
    for (let i = 0; i < machineCode.length; i++) {
      this.memory[origin + i] = machineCode[i] & 0xFFFF;
    }
  }

  getStats(): VMStats {
    return {
      instructionsExecuted: this.instructionsExecuted,
      memoryReads: this.memoryReads,
      memoryWrites: this.memoryWrites,
      branchesTaken: this.branchesTaken,
      branchesNotTaken: this.branchesNotTaken,
    };
  }

  getState(): VMState {
    return {
      registers: new Int16Array(this.registers),
      pc: this.pc,
      cc: { ...this.cc },
      memory: this.memory,
      halted: this.halted,
      output: this.output,
      instructionsExecuted: this.instructionsExecuted,
      stats: this.getStats(),
    };
  }

  setCC(value: number) {
    const val = toInt16(value);
    this.cc.n = val < 0;
    this.cc.z = val === 0;
    this.cc.p = val > 0;
  }

  // Memory-mapped I/O aware read
  readMem(addr: number): number {
    addr = addr & 0xFFFF;
    if (addr === KBSR) {
      // Return ready bit if input is available
      if (this.inputBuffer.length > 0) {
        return 0x8000;
      }
      if (this.inputCallback) {
        // Peek: don't consume
        return 0x8000; // assume ready if callback exists
      }
      return 0;
    }
    if (addr === KBDR) {
      // Return next character from input buffer and clear ready bit
      if (this.inputBuffer.length > 0) {
        const ch = this.inputBuffer.charCodeAt(0);
        this.inputBuffer = this.inputBuffer.substring(1);
        return ch & 0xFFFF;
      }
      if (this.inputCallback) {
        const ch = this.inputCallback();
        if (ch !== null) return ch.charCodeAt(0) & 0xFFFF;
      }
      return 0;
    }
    if (addr === DSR) {
      return 0x8000; // display always ready
    }
    if (addr === MCR) {
      return this.halted ? 0 : 0x8000;
    }
    return this.memory[addr];
  }

  // Memory-mapped I/O aware write
  writeMem(addr: number, val: number) {
    addr = addr & 0xFFFF;
    val = val & 0xFFFF;
    if (addr === DDR) {
      // Write character to output
      this.output += String.fromCharCode(val & 0xFF);
      return;
    }
    if (addr === MCR) {
      // Clearing bit 15 halts the machine
      if (!(val & 0x8000)) {
        this.halted = true;
      }
      this.memory[addr] = val;
      return;
    }
    this.memory[addr] = val;
  }

  step(): boolean {
    if (this.halted || this.waitingForInput) return false;

    const instr = this.memory[this.pc & 0xFFFF];
    this.pc = (this.pc + 1) & 0xFFFF;
    this.instructionsExecuted++;

    const opcode = (instr >> 12) & 0xF;

    switch (opcode) {
      case Opcode.ADD: this.execADD(instr); break;
      case Opcode.AND: this.execAND(instr); break;
      case Opcode.NOT: this.execNOT(instr); break;
      case Opcode.BR: this.execBR(instr); break;
      case Opcode.LD: this.execLD(instr); break;
      case Opcode.LDI: this.execLDI(instr); break;
      case Opcode.LDR: this.execLDR(instr); break;
      case Opcode.LEA: this.execLEA(instr); break;
      case Opcode.ST: this.execST(instr); break;
      case Opcode.STI: this.execSTI(instr); break;
      case Opcode.STR: this.execSTR(instr); break;
      case Opcode.JMP: this.execJMP(instr); break;
      case Opcode.JSR: this.execJSR(instr); break;
      case Opcode.TRAP: this.execTRAP(instr); break;
      case Opcode.RTI: break; // Not implemented in user mode
      case Opcode.RESERVED: break;
    }

    return !this.halted;
  }

  run(maxSteps: number = 50000): { completed: boolean; steps: number; waitingForInput: boolean } {
    let steps = 0;
    while (!this.halted && !this.waitingForInput && steps < maxSteps) {
      this.step();
      steps++;
    }
    return { completed: this.halted, steps, waitingForInput: this.waitingForInput };
  }

  private execADD(instr: number) {
    const dr = (instr >> 9) & 0x7;
    const sr1 = (instr >> 6) & 0x7;

    if ((instr >> 5) & 1) {
      const imm5 = signExtend(instr & 0x1F, 5);
      this.registers[dr] = toInt16(this.registers[sr1] + imm5);
    } else {
      const sr2 = instr & 0x7;
      this.registers[dr] = toInt16(this.registers[sr1] + this.registers[sr2]);
    }
    this.setCC(this.registers[dr]);
  }

  private execAND(instr: number) {
    const dr = (instr >> 9) & 0x7;
    const sr1 = (instr >> 6) & 0x7;

    if ((instr >> 5) & 1) {
      const imm5 = signExtend(instr & 0x1F, 5);
      this.registers[dr] = toInt16(this.registers[sr1] & imm5);
    } else {
      const sr2 = instr & 0x7;
      this.registers[dr] = toInt16(this.registers[sr1] & this.registers[sr2]);
    }
    this.setCC(this.registers[dr]);
  }

  private execNOT(instr: number) {
    const dr = (instr >> 9) & 0x7;
    const sr = (instr >> 6) & 0x7;
    this.registers[dr] = toInt16(~this.registers[sr]);
    this.setCC(this.registers[dr]);
  }

  private execBR(instr: number) {
    const n = (instr >> 11) & 1;
    const z = (instr >> 10) & 1;
    const p = (instr >> 9) & 1;
    const offset = signExtend(instr & 0x1FF, 9);

    if ((n && this.cc.n) || (z && this.cc.z) || (p && this.cc.p)) {
      this.pc = (this.pc + offset) & 0xFFFF;
      this.branchesTaken++;
    } else {
      this.branchesNotTaken++;
    }
  }

  private execLD(instr: number) {
    const dr = (instr >> 9) & 0x7;
    const offset = signExtend(instr & 0x1FF, 9);
    const addr = (this.pc + offset) & 0xFFFF;
    this.registers[dr] = toInt16(this.readMem(addr));
    this.memoryReads++;
    this.setCC(this.registers[dr]);
  }

  private execLDI(instr: number) {
    const dr = (instr >> 9) & 0x7;
    const offset = signExtend(instr & 0x1FF, 9);
    const addr1 = (this.pc + offset) & 0xFFFF;
    const addr2 = this.readMem(addr1) & 0xFFFF;
    this.registers[dr] = toInt16(this.readMem(addr2));
    this.memoryReads += 2;
    this.setCC(this.registers[dr]);
  }

  private execLDR(instr: number) {
    const dr = (instr >> 9) & 0x7;
    const baseR = (instr >> 6) & 0x7;
    const offset = signExtend(instr & 0x3F, 6);
    const addr = ((this.registers[baseR] & 0xFFFF) + offset) & 0xFFFF;
    this.registers[dr] = toInt16(this.readMem(addr));
    this.memoryReads++;
    this.setCC(this.registers[dr]);
  }

  private execLEA(instr: number) {
    const dr = (instr >> 9) & 0x7;
    const offset = signExtend(instr & 0x1FF, 9);
    this.registers[dr] = toInt16((this.pc + offset) & 0xFFFF);
    this.setCC(this.registers[dr]);
  }

  private execST(instr: number) {
    const sr = (instr >> 9) & 0x7;
    const offset = signExtend(instr & 0x1FF, 9);
    const addr = (this.pc + offset) & 0xFFFF;
    this.writeMem(addr, this.registers[sr] & 0xFFFF);
    this.memoryWrites++;
  }

  private execSTI(instr: number) {
    const sr = (instr >> 9) & 0x7;
    const offset = signExtend(instr & 0x1FF, 9);
    const addr1 = (this.pc + offset) & 0xFFFF;
    const addr2 = this.readMem(addr1) & 0xFFFF;
    this.writeMem(addr2, this.registers[sr] & 0xFFFF);
    this.memoryReads++;
    this.memoryWrites++;
  }

  private execSTR(instr: number) {
    const sr = (instr >> 9) & 0x7;
    const baseR = (instr >> 6) & 0x7;
    const offset = signExtend(instr & 0x3F, 6);
    const addr = ((this.registers[baseR] & 0xFFFF) + offset) & 0xFFFF;
    this.writeMem(addr, this.registers[sr] & 0xFFFF);
    this.memoryWrites++;
  }

  private execJMP(instr: number) {
    const baseR = (instr >> 6) & 0x7;
    this.pc = this.registers[baseR] & 0xFFFF;
  }

  private execJSR(instr: number) {
    this.registers[7] = toInt16(this.pc);

    if ((instr >> 11) & 1) {
      // JSR
      const offset = signExtend(instr & 0x7FF, 11);
      this.pc = (this.pc + offset) & 0xFFFF;
    } else {
      // JSRR
      const baseR = (instr >> 6) & 0x7;
      this.pc = this.registers[baseR] & 0xFFFF;
    }
  }

  private execTRAP(instr: number) {
    const trapVec = instr & 0xFF;

    switch (trapVec) {
      case 0x20: // GETC
        if (this.inputBuffer.length > 0) {
          this.registers[0] = this.inputBuffer.charCodeAt(0);
          this.inputBuffer = this.inputBuffer.substring(1);
          this.setCC(this.registers[0]);
        } else if (this.inputCallback) {
          const ch = this.inputCallback();
          if (ch !== null) {
            this.registers[0] = ch.charCodeAt(0);
          } else {
            this.registers[0] = 0;
          }
          this.setCC(this.registers[0]);
        } else {
          // No input available — pause and rewind PC to re-execute this TRAP
          this.waitingForInput = true;
          this.pc = (this.pc - 1) & 0xFFFF;
          this.instructionsExecuted--;
        }
        break;

      case 0x21: // OUT
        this.output += String.fromCharCode(this.registers[0] & 0xFF);
        break;

      case 0x22: // PUTS
        {
          let addr = this.registers[0] & 0xFFFF;
          while (this.memory[addr] !== 0) {
            this.output += String.fromCharCode(this.memory[addr] & 0xFF);
            this.memoryReads++;
            addr = (addr + 1) & 0xFFFF;
          }
          this.memoryReads++; // null terminator read
        }
        break;

      case 0x23: // IN
        if (this.inputBuffer.length > 0) {
          this.registers[0] = this.inputBuffer.charCodeAt(0);
          this.inputBuffer = this.inputBuffer.substring(1);
          this.output += String.fromCharCode(this.registers[0] & 0xFF);
          this.setCC(this.registers[0]);
        } else if (this.inputCallback) {
          const ch = this.inputCallback();
          if (ch !== null) {
            this.registers[0] = ch.charCodeAt(0);
            this.output += ch;
          } else {
            this.registers[0] = 0;
          }
          this.setCC(this.registers[0]);
        } else {
          // No input available — pause and rewind PC to re-execute this TRAP
          this.waitingForInput = true;
          this.pc = (this.pc - 1) & 0xFFFF;
          this.instructionsExecuted--;
        }
        break;

      case 0x24: // PUTSP
        {
          let addr = this.registers[0] & 0xFFFF;
          while (this.memory[addr] !== 0) {
            const word = this.memory[addr];
            const lo = word & 0xFF;
            const hi = (word >> 8) & 0xFF;
            if (lo !== 0) this.output += String.fromCharCode(lo);
            if (hi !== 0) this.output += String.fromCharCode(hi);
            addr = (addr + 1) & 0xFFFF;
          }
        }
        break;

      case 0x25: // HALT
        this.halted = true;
        break;
    }
  }
}
