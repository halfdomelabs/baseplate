import { describe, expect, it } from 'vitest';

import { assertValidTestDatabaseName } from './prisma-vitest.generator.js';

/**
 * Longest base name that still leaves room for `_<runId>_tpl` within Postgres's
 * 63-byte identifier limit.
 */
const MAX_BASE_NAME_BYTES = 48;

describe('assertValidTestDatabaseName', () => {
  it('accepts a base name that fills the byte budget exactly', () => {
    const baseName = 'a'.repeat(MAX_BASE_NAME_BYTES);

    expect(assertValidTestDatabaseName(baseName)).toBe(baseName);
  });

  it('rejects a base name one byte over the budget', () => {
    expect(() =>
      assertValidTestDatabaseName('a'.repeat(MAX_BASE_NAME_BYTES + 1)),
    ).toThrow(/too long/);
  });

  it('leaves room for the longest name the budget allows', () => {
    const baseName = 'a'.repeat(MAX_BASE_NAME_BYTES);
    const runId = 'x'.repeat(10);

    expect(`${baseName}_${runId}_tpl`).toHaveLength(63);
  });

  it('rejects names that are not safe unquoted identifiers', () => {
    expect(() => assertValidTestDatabaseName('my-app_test')).toThrow(
      /not a valid Postgres identifier/,
    );
    expect(() => assertValidTestDatabaseName('1app_test')).toThrow(
      /not a valid Postgres identifier/,
    );
  });
});
