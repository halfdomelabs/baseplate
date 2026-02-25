import { describe, expect, it } from 'vitest';

import { checkUniqueField } from './definition-issue-checkers.js';

describe('checkUniqueField', () => {
  const checker = checkUniqueField('name', { label: 'item name' });

  it('returns no issues when all values are unique', () => {
    const items = [{ name: 'alpha' }, { name: 'beta' }, { name: 'gamma' }];
    const issues = checker(items, { path: ['items'] });
    expect(issues).toEqual([]);
  });

  it('returns an issue for duplicate values', () => {
    const items = [{ name: 'alpha' }, { name: 'beta' }, { name: 'alpha' }];
    const issues = checker(items, { path: ['items'] });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      message: 'Duplicate item name "alpha"',
      path: ['items', 2, 'name'],
      severity: 'error',
    });
  });

  it('reports all duplicates after the first occurrence', () => {
    const items = [{ name: 'alpha' }, { name: 'alpha' }, { name: 'alpha' }];
    const issues = checker(items, { path: ['items'] });

    expect(issues).toHaveLength(2);
    expect(issues[0].path).toEqual(['items', 1, 'name']);
    expect(issues[1].path).toEqual(['items', 2, 'name']);
  });

  it('skips undefined, null, and empty string values', () => {
    const items = [
      { name: undefined },
      { name: null },
      { name: '' },
      { name: undefined },
    ] as unknown as { name: string }[];
    const issues = checker(items, { path: [] });
    expect(issues).toEqual([]);
  });

  it('uses custom severity when provided', () => {
    const warningChecker = checkUniqueField('name', {
      label: 'item name',
      severity: 'warning',
    });
    const items = [{ name: 'alpha' }, { name: 'alpha' }];
    const issues = warningChecker(items, { path: [] });

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('warning');
  });

  it('works with numeric field values', () => {
    const portChecker = checkUniqueField('port', { label: 'port' });
    const items = [{ port: 3000 }, { port: 3001 }, { port: 3000 }];
    const issues = portChecker(items, { path: ['apps'] });

    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      message: 'Duplicate port "3000"',
      path: ['apps', 2, 'port'],
      severity: 'error',
    });
  });

  it('defaults label to field name', () => {
    const defaultChecker = checkUniqueField('name');
    const items = [{ name: 'alpha' }, { name: 'alpha' }];
    const issues = defaultChecker(items, { path: [] });

    expect(issues[0].message).toBe('Duplicate name "alpha"');
  });

  it('returns no issues for empty array', () => {
    const issues = checker([], { path: [] });
    expect(issues).toEqual([]);
  });
});
