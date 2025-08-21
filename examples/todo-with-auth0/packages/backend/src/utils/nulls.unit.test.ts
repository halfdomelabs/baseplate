import { describe, expect, it } from 'vitest';

import { restrictObjectNulls } from './nulls.js';

describe('restrictObjectNulls', () => {
  it('should allow an empty object through', () => {
    const object = restrictObjectNulls({}, []);
    expect(object).toEqual({});
  });

  it('should allow a simple object through', () => {
    const object: { test: string | null; field2: string } = {
      test: 'test',
      field2: 'field2',
    };
    const result = restrictObjectNulls(object, ['test']);
    expect(result).toEqual(object);
  });

  it('should reject an object with a restricted null field', () => {
    const object = { test: null, field2: 'field2' };
    expect(() => restrictObjectNulls(object, ['test'])).toThrow();
  });
});
