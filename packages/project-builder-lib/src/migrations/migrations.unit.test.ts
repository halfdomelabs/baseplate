import { describe, expect, it } from 'vitest';

import { SCHEMA_MIGRATIONS } from './index.js';

function validateSchemaMigrations(): void {
  const startValue = SCHEMA_MIGRATIONS[0].version;
  SCHEMA_MIGRATIONS.reduce((prev, migration) => {
    if (migration.version !== prev + 1) {
      throw new Error(
        `Schema migrations must be in increasing order by 1: ${migration.version} <= ${prev}`,
      );
    }
    return migration.version;
  }, startValue - 1);
}

describe('validateSchemaMigrations', () => {
  it('validates that schema migrations are in increasing order by 1', () => {
    expect(() => validateSchemaMigrations()).not.toThrow();
  });
});
