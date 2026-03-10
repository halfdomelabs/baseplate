import { describe, expect, it } from 'vitest';

import { queryHelpers } from './query-helpers.js';

describe('queryHelpers.or', () => {
  it('should return true if any clause is true', () => {
    expect(queryHelpers.or([false, true, { id: '1' }])).toBe(true);
  });

  it('should return false if all clauses are false', () => {
    expect(queryHelpers.or([false, false])).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(queryHelpers.or([])).toBe(false);
  });

  it('should unwrap single element', () => {
    expect(queryHelpers.or([{ id: '1' }])).toEqual({ id: '1' });
  });

  it('should filter out false and combine with OR', () => {
    expect(queryHelpers.or([false, { id: '1' }, { name: 'test' }])).toEqual({
      OR: [{ id: '1' }, { name: 'test' }],
    });
  });

  it('should combine multiple where clauses with OR', () => {
    expect(queryHelpers.or([{ id: '1' }, { id: '2' }])).toEqual({
      OR: [{ id: '1' }, { id: '2' }],
    });
  });
});

describe('queryHelpers.and', () => {
  it('should return false if any clause is false', () => {
    expect(queryHelpers.and([true, false, { id: '1' }])).toBe(false);
  });

  it('should return true if all clauses are true', () => {
    expect(queryHelpers.and([true, true])).toBe(true);
  });

  it('should return true for empty array (vacuous truth)', () => {
    expect(queryHelpers.and([])).toBe(true);
  });

  it('should unwrap single element', () => {
    expect(queryHelpers.and([{ id: '1' }])).toEqual({ id: '1' });
  });

  it('should filter out true and combine with AND', () => {
    expect(queryHelpers.and([true, { id: '1' }, { name: 'test' }])).toEqual({
      AND: [{ id: '1' }, { name: 'test' }],
    });
  });

  it('should combine multiple where clauses with AND', () => {
    expect(queryHelpers.and([{ id: '1' }, { id: '2' }])).toEqual({
      AND: [{ id: '1' }, { id: '2' }],
    });
  });
});
