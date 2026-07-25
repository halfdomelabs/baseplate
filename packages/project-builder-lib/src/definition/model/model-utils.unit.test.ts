import { describe, expect, it } from 'vitest';

import { ModelUtils } from './model-utils.js';

const { isFieldSafeToFilter } = ModelUtils;

describe('isFieldSafeToFilter', () => {
  it('is safe when the field is unrestricted, regardless of the query', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: [], instanceRoles: [] },
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
      ),
    ).toBe(true);
  });

  it('is safe when both the field and query are unrestricted', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: [], instanceRoles: [] },
        { globalRoles: [], instanceRoles: [] },
      ),
    ).toBe(true);
  });

  it('is unsafe when the field is restricted but the query is unrestricted', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: [] },
        { globalRoles: [], instanceRoles: [] },
      ),
    ).toBe(false);
  });

  it('is unsafe when the field has fewer roles than the query (a caller who can query cannot read the field)', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: [] },
        { globalRoles: ['admin', 'editor'], instanceRoles: [] },
      ),
    ).toBe(false);
  });

  it('is safe when the field and query roles are identical', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
      ),
    ).toBe(true);
  });

  it('is safe when the field has a superset of the query roles', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin', 'support'], instanceRoles: [] },
        { globalRoles: ['admin'], instanceRoles: [] },
      ),
    ).toBe(true);
  });

  it('is unsafe when instanceRoles diverge even if globalRoles match', () => {
    expect(
      isFieldSafeToFilter(
        { globalRoles: ['admin'], instanceRoles: ['owner'] },
        { globalRoles: ['admin'], instanceRoles: ['owner', 'editor'] },
      ),
    ).toBe(false);
  });
});
