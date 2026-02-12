'use client';

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { LC3VM, assemble } from '@/lib/lc3';
import { markProjectPassed } from '@/lib/storage';
import type { TestCase } from '@/lib/projects/index';

interface AutograderProps {
  projectId: string;
  code: string;
  tests: TestCase[];
  showButton?: boolean;
}

export interface AutograderHandle {
  runTests: () => void;
  running: boolean;
}

interface TestResult {
  description: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

const Autograder = forwardRef<AutograderHandle, AutograderProps>(function Autograder({ projectId, code, tests, showButton = true }, ref) {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runTests = useCallback(() => {
    setRunning(true);

    const testResults: TestResult[] = [];

    for (const test of tests) {
      // Assemble
      const result = assemble(code);
      if (result.errors.length > 0) {
        testResults.push({
          description: test.description,
          passed: false,
          expected: test.expectedOutput ?? '',
          actual: '',
          error: result.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n'),
        });
        continue;
      }

      // Run
      const vm = new LC3VM();
      vm.load(result.origin, result.machineCode);
      if (test.preloadMemory) {
        for (const mem of test.preloadMemory) {
          vm.memory[mem.address] = mem.value & 0xFFFF;
        }
      }
      if (test.input) {
        vm.inputBuffer = test.input;
      }

      const runResult = vm.run(100000);

      let passed = true;
      let actual = vm.output;

      // Check output
      if (test.expectedOutput !== undefined && test.expectedOutput !== '') {
        if (vm.output.trim() !== test.expectedOutput.trim()) {
          passed = false;
        }
      }

      // Check memory
      if (test.checkMemory) {
        for (const check of test.checkMemory) {
          if (vm.memory[check.address] !== (check.value & 0xFFFF)) {
            passed = false;
            actual += ` (memory[x${check.address.toString(16)}] = ${vm.memory[check.address]}, expected ${check.value})`;
          }
        }
      }

      // Check registers
      if (test.checkRegisters) {
        for (const check of test.checkRegisters) {
          const regVal = vm.registers[check.register] & 0xFFFF;
          const expected = check.value & 0xFFFF;
          if (regVal !== expected) {
            passed = false;
            actual += ` (R${check.register} = ${regVal}, expected ${expected})`;
          }
        }
      }

      // Build expected display string
      let expectedDisplay = test.expectedOutput ?? '';
      if (test.checkMemory) {
        const memStr = test.checkMemory.map(c =>
          `mem[x${c.address.toString(16).toUpperCase()}]=${c.value}`
        ).join(', ');
        expectedDisplay = expectedDisplay ? `${expectedDisplay} | ${memStr}` : memStr;
      }
      if (test.checkRegisters) {
        const regStr = test.checkRegisters.map(c =>
          `R${c.register}=${c.value}`
        ).join(', ');
        expectedDisplay = expectedDisplay ? `${expectedDisplay} | ${regStr}` : regStr;
      }

      testResults.push({
        description: test.description,
        passed,
        expected: expectedDisplay,
        actual: actual.trim(),
        error: !runResult.completed ? 'Program did not halt (possible infinite loop)' : undefined,
      });
    }

    setResults(testResults);
    if (testResults.length > 0 && testResults.every(r => r.passed)) {
      markProjectPassed(projectId);
    }
    setRunning(false);
  }, [code, tests, projectId]);

  useImperativeHandle(ref, () => ({ runTests, running }), [runTests, running]);

  const allPassed = results.length > 0 && results.every(r => r.passed);
  const passed = results.filter(r => r.passed).length;

  // When button is hidden and no results, render nothing
  if (!showButton && results.length === 0) return null;

  return (
    <div className="border-t border-border bg-surface">
      {showButton && (
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={runTests}
            disabled={running}
            className="px-4 py-1.5 text-xs font-medium bg-accent text-white rounded transition-colors disabled:opacity-40"
          >
            {running ? 'Running Tests...' : 'Run Tests'}
          </button>

          {results.length > 0 && (
            <span className={`text-xs font-medium ${allPassed ? 'text-success' : 'text-error'}`}>
              {passed}/{results.length} passed
            </span>
          )}
        </div>
      )}

      {!showButton && results.length > 0 && (
        <div className="px-4 py-2 flex items-center gap-2">
          <span className={`text-xs font-medium ${allPassed ? 'text-success' : 'text-error'}`}>
            {passed}/{results.length} passed
          </span>
        </div>
      )}

      {results.length > 0 && (
        <div className="border-t border-border">
          {results.map((r, i) => (
            <div
              key={i}
              className={`px-4 py-2.5 flex items-start gap-3 text-xs ${
                i < results.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <span className={`font-mono ${r.passed ? 'text-success' : 'text-error'}`}>
                {r.passed ? '✓' : '✗'}
              </span>
              <div className="flex-1">
                <div className={r.passed ? 'text-text-dim' : 'text-text'}>{r.description}</div>
                {!r.passed && (
                  <div className="mt-1 font-mono">
                    {r.error ? (
                      <div className="text-error">{r.error}</div>
                    ) : (
                      <>
                        <div className="text-text-dimmer">Expected: <span className="text-success">&quot;{r.expected}&quot;</span></div>
                        <div className="text-text-dimmer">Got: <span className="text-error">&quot;{r.actual}&quot;</span></div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {allPassed && (
            <div className="px-4 py-3 bg-success/5 text-success text-xs font-medium">
              All tests passed! Great work.
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default Autograder;
