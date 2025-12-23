// @ts-nocheck

import type { MockedFunction } from 'vitest';

import { expect, vi } from 'vitest';

type MockedLogFn = MockedFunction<(...args: unknown[]) => void>;

/**
 * Mock logger interface that matches the Pino logger structure.
 */
export interface MockLogger {
  info: MockedLogFn;
  warn: MockedLogFn;
  error: MockedLogFn;
  debug: MockedLogFn;
  trace: MockedLogFn;
}

/**
 * Create a mock logger with spy functions for all log levels.
 * If TEST_SHOW_CONSOLE=true, logs will be output to the console.
 * @returns Mock logger instance with vitest spy functions or console passthroughs.
 */
export function createMockLogger(): MockLogger {
  const showConsole = !!process.env.TEST_SHOW_CONSOLE;

  const makeLoggerFn = (level: keyof MockLogger): MockedLogFn => {
    return vi.fn((...args: unknown[]) => {
      if (showConsole) {
        // eslint-disable-next-line no-console
        console[level](...args);
      }
    });
  };

  return {
    info: makeLoggerFn('info'),
    warn: makeLoggerFn('warn'),
    error: makeLoggerFn('error'),
    debug: makeLoggerFn('debug'),
    trace: makeLoggerFn('trace'),
  };
}

/**
 * Get all calls made to a specific log level.
 * @param mockLogger The mock logger instance.
 * @param level The log level to get calls for.
 * @returns Array of call arguments for the specified level.
 */
export function getLogCalls(
  mockLogger: MockLogger,
  level: keyof MockLogger,
): unknown[][] {
  return mockLogger[level].mock.calls;
}

/**
 * Get the number of calls made to a specific log level.
 * @param mockLogger The mock logger instance.
 * @param level The log level to count calls for.
 * @returns Number of calls made to the specified level.
 */
export function getLogCallCount(
  mockLogger: MockLogger,
  level: keyof MockLogger,
): number {
  return mockLogger[level].mock.calls.length;
}

/**
 * Assert that a specific log level was called at least once.
 * @param mockLogger The mock logger instance.
 * @param level The log level to check.
 * @throws Error if the assertion fails.
 */
export function expectLogged(
  mockLogger: MockLogger,
  level: keyof MockLogger,
): void {
  const callCount = getLogCallCount(mockLogger, level);
  expect(callCount).toBeGreaterThan(0);
}

/**
 * Assert that a specific log level was not called.
 * @param mockLogger The mock logger instance.
 * @param level The log level to check.
 * @throws Error if the assertion fails.
 */
export function expectNotLogged(
  mockLogger: MockLogger,
  level: keyof MockLogger,
): void {
  const callCount = getLogCallCount(mockLogger, level);
  expect(callCount).toBe(0);
}

/**
 * Reset all mock functions in the logger.
 * @param mockLogger The mock logger instance to reset.
 */
export function resetMockLogger(mockLogger: MockLogger): void {
  for (const mockFn of Object.values(mockLogger)) {
    (mockFn as MockedLogFn).mockReset();
  }
}
