import { describe, expect, it } from 'vitest';

import type { DefinitionDiffOperation } from './definition-diff.js';

import {
  applyDefinitionDiff,
  createDefinitionDiff,
  createDefinitionDiffConfig,
  DefinitionDiffKeyedArrayField,
  DefinitionDiffReplacementField,
} from './definition-diff.js';

interface TestItem extends Record<string, unknown> {
  id: string;
  value: string;
  timestamp?: string;
}

interface TestSettings {
  theme: string;
}

interface TestConfig {
  items: TestItem[];
  settings: TestSettings;
}

describe('DefinitionDiffKeyedArrayField', () => {
  it('should detect additions to arrays', () => {
    const field = new DefinitionDiffKeyedArrayField<TestItem[]>(
      'items',
      (item) => item.id,
    );
    const current: TestItem[] = [{ id: '1', value: 'a' }];
    const desired: TestItem[] = [
      { id: '1', value: 'a' },
      { id: '2', value: 'b' },
    ];

    const diff = field.diff(current, desired);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      type: 'add',
      key: '2',
      item: { id: '2', value: 'b' },
    });
  });

  it('should detect updates to array items', () => {
    const field = new DefinitionDiffKeyedArrayField<TestItem[]>(
      'items',
      (item) => item.id,
    );
    const current: TestItem[] = [{ id: '1', value: 'a' }];
    const desired: TestItem[] = [{ id: '1', value: 'b' }];

    const diff = field.diff(current, desired);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      type: 'update',
      key: '1',
      item: { id: '1', value: 'b' },
    });
  });

  it('should detect removals from arrays when allowed', () => {
    const field = new DefinitionDiffKeyedArrayField<TestItem[]>(
      'items',
      (item) => item.id,
      {
        allowRemove: true,
      },
    );
    const current: TestItem[] = [
      { id: '1', value: 'a' },
      { id: '2', value: 'b' },
    ];
    const desired: TestItem[] = [{ id: '1', value: 'a' }];

    const diff = field.diff(current, desired);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      type: 'remove',
      key: '2',
      item: { id: '2', value: 'b' },
    });
  });

  it('should ignore specified fields when comparing', () => {
    const field = new DefinitionDiffKeyedArrayField<TestItem[]>(
      'items',
      (item) => item.id,
      {
        ignoreFields: ['timestamp'],
      },
    );
    const current: TestItem[] = [{ id: '1', value: 'a', timestamp: '123' }];
    const desired: TestItem[] = [{ id: '1', value: 'a', timestamp: '456' }];

    const diff = field.diff(current, desired);
    expect(diff).toHaveLength(0);
  });

  it('should apply diffs correctly', () => {
    const field = new DefinitionDiffKeyedArrayField<TestItem[]>(
      'items',
      (item) => item.id,
    );
    const current: TestItem[] = [{ id: '1', value: 'a' }];
    const diff: DefinitionDiffOperation<TestItem>[] = [
      { type: 'add', key: '2', item: { id: '2', value: 'b' } },
      { type: 'update', key: '1', item: { id: '1', value: 'c' } },
    ];

    const result = field.apply(current, diff);
    expect(result).toEqual([
      { id: '1', value: 'c' },
      { id: '2', value: 'b' },
    ]);
  });
});

describe('DefinitionDiffReplacementField', () => {
  it('should detect changes to values', () => {
    const field = new DefinitionDiffReplacementField<TestSettings>('value');
    const current: TestSettings = { theme: 'light' };
    const desired: TestSettings = { theme: 'dark' };

    const diff = field.diff(current, desired);
    expect(diff).toHaveLength(1);
    expect(diff[0]).toEqual({
      type: 'update',
      key: '*',
      item: { theme: 'dark' },
    });
  });

  it('should not detect changes when values are equal', () => {
    const field = new DefinitionDiffReplacementField<TestSettings>('value');
    const current: TestSettings = { theme: 'light' };
    const desired: TestSettings = { theme: 'light' };

    const diff = field.diff(current, desired);
    expect(diff).toHaveLength(0);
  });

  it('should apply diffs correctly', () => {
    const field = new DefinitionDiffReplacementField<TestSettings>('value');
    const current: TestSettings = { theme: 'light' };
    const diff: DefinitionDiffOperation<TestSettings>[] = [
      { type: 'update', key: '*', item: { theme: 'dark' } },
    ];

    const result = field.apply(current, diff);
    expect(result).toEqual({ theme: 'dark' });
  });
});

describe('createDefinitionDiff', () => {
  it('should create diffs for nested objects', () => {
    const config = createDefinitionDiffConfig<TestConfig>({
      items: new DefinitionDiffKeyedArrayField<TestItem[]>(
        'items',
        (item) => item.id,
      ),
      settings: new DefinitionDiffReplacementField<TestSettings>('settings'),
    });

    const current: TestConfig = {
      items: [{ id: '1', value: 'a' }],
      settings: { theme: 'light' },
    };

    const desired: TestConfig = {
      items: [
        { id: '1', value: 'b' },
        { id: '2', value: 'c' },
      ],
      settings: { theme: 'dark' },
    };

    const diff = createDefinitionDiff(current, desired, config);
    expect(diff).toBeDefined();
    expect(diff?.items).toHaveLength(2);
    expect(diff?.settings).toHaveLength(1);
  });

  it('should return undefined when no changes are detected', () => {
    const config = createDefinitionDiffConfig<TestConfig>({
      items: new DefinitionDiffKeyedArrayField<TestItem[]>(
        'items',
        (item) => item.id,
      ),
      settings: new DefinitionDiffReplacementField<TestSettings>('settings'),
    });

    const current: TestConfig = {
      items: [{ id: '1', value: 'a' }],
      settings: { theme: 'light' },
    };

    const desired: TestConfig = {
      items: [{ id: '1', value: 'a' }],
      settings: { theme: 'light' },
    };

    const diff = createDefinitionDiff(current, desired, config);
    expect(diff).toBeUndefined();
  });
});

describe('applyDefinitionDiff', () => {
  it('should apply diffs to nested objects', () => {
    const config = createDefinitionDiffConfig<TestConfig>({
      items: new DefinitionDiffKeyedArrayField<TestItem[]>(
        'items',
        (item) => item.id,
      ),
      settings: new DefinitionDiffReplacementField<TestSettings>('settings'),
    });

    const current: TestConfig = {
      items: [{ id: '1', value: 'a' }],
      settings: { theme: 'light' },
    };

    const diff = {
      items: [
        { type: 'update' as const, key: '1', item: { id: '1', value: 'b' } },
        { type: 'add' as const, key: '2', item: { id: '2', value: 'c' } },
      ],
      settings: [
        { type: 'update' as const, key: '*', item: { theme: 'dark' } },
      ],
    };

    const result = applyDefinitionDiff(current, diff, config);
    expect(result).toEqual({
      items: [
        { id: '1', value: 'b' },
        { id: '2', value: 'c' },
      ],
      settings: { theme: 'dark' },
    });
  });
});
