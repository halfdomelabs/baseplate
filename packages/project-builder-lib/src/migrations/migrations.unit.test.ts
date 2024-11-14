import { describe, expect, it } from 'vitest';

import { SCHEMA_MIGRATIONS } from './index.js';

function validateSchemaMigrations(): void {
  for (let i = 1; i < SCHEMA_MIGRATIONS.length; i++) {
    const currentVersion = SCHEMA_MIGRATIONS[i].version;
    const previousVersion = SCHEMA_MIGRATIONS[i - 1].version;
    if (currentVersion !== previousVersion + 1) {
      throw new Error(
        `Schema migrations must be in increasing order by 1: ${currentVersion} <= ${previousVersion}`,
      );
    }
  }
}

describe('validateSchemaMigrations', () => {
  it('validates that schema migrations are in increasing order by 1', () => {
    expect(() => {
      validateSchemaMigrations();
    }).not.toThrow();
  });
});
