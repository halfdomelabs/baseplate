import { describe, expect, test } from 'vitest';

import { PluginSpecStore } from '../store/store.js';
import { createFieldMapSpec } from './create-field-map-spec.js';

describe('createFieldMapSpec', () => {
  test('should create a spec with namedArrayToMap container', () => {
    interface TestItem {
      name: string;
      value: number;
    }

    const spec = createFieldMapSpec('test/spec', (t) => ({
      items: t.namedArrayToMap<TestItem>(),
    }));

    expect(spec.name).toBe('test/spec');
    expect(spec.type).toBe('plugin-spec');
  });

  test('should allow adding items during init phase', () => {
    interface TestItem {
      name: string;
      value: number;
    }

    const spec = createFieldMapSpec('test/spec', (t) => ({
      items: t.namedArrayToMap<TestItem>(),
    }));

    const { init, use } = spec.initializer();
    init.items.add({ name: 'item1', value: 1 });
    init.items.add({ name: 'item2', value: 2 });

    const result = use();
    expect(result.items.size).toBe(2);
    expect(result.items.get('item1')).toEqual({ name: 'item1', value: 1 });
    expect(result.items.get('item2')).toEqual({ name: 'item2', value: 2 });
  });

  test('should throw when adding duplicate items', () => {
    interface TestItem {
      name: string;
      value: number;
    }

    const spec = createFieldMapSpec('test/spec', (t) => ({
      items: t.namedArrayToMap<TestItem>(),
    }));

    const { init } = spec.initializer();
    init.items.add({ name: 'item1', value: 1 }, 'plugin-a');

    expect(() => {
      init.items.add({ name: 'item1', value: 2 }, 'plugin-b');
    }).toThrow(/plugin-a.*plugin-b/);
  });

  test('should support custom use interface', () => {
    interface TestItem {
      name: string;
      value: number;
    }

    const spec = createFieldMapSpec(
      'test/spec',
      (t) => ({
        items: t.namedArrayToMap<TestItem>(),
      }),
      {
        use: (values) => ({
          getItem: (name: string) => values.items.get(name),
          getAllItems: () => [...values.items.values()],
        }),
      },
    );

    const { init, use } = spec.initializer();
    init.items.add({ name: 'item1', value: 1 });

    const result = use();
    expect(result.getItem('item1')).toEqual({ name: 'item1', value: 1 });
    expect(result.getAllItems()).toEqual([{ name: 'item1', value: 1 }]);
  });

  test('should work with array container', () => {
    const spec = createFieldMapSpec('test/spec', (t) => ({
      values: t.array<string>(),
    }));

    const { init, use } = spec.initializer();
    init.values.push('a', 'b', 'c');

    const result = use();
    expect(result.values).toEqual(['a', 'b', 'c']);
  });

  test('should work with scalar container', () => {
    const spec = createFieldMapSpec('test/spec', (t) => ({
      config: t.scalar<{ enabled: boolean }>(),
    }));

    const { init, use } = spec.initializer();
    init.config.set({ enabled: true }, 'plugin-a');

    const result = use();
    expect(result.config).toEqual({ enabled: true });
  });

  test('should throw when setting scalar twice', () => {
    const spec = createFieldMapSpec('test/spec', (t) => ({
      config: t.scalar<{ enabled: boolean }>(),
    }));

    const { init } = spec.initializer();
    init.config.set({ enabled: true }, 'plugin-a');

    expect(() => {
      init.config.set({ enabled: false }, 'plugin-b');
    }).toThrow(/plugin-a.*plugin-b/);
  });
});

describe('PluginSpecStore', () => {
  test('should lazily initialize specs on first use', () => {
    let initializeCount = 0;
    const spec = createFieldMapSpec('test/spec', (t) => {
      initializeCount++;
      return {
        items: t.namedArrayToMap<{ name: string }>(),
      };
    });

    const store = new PluginSpecStore();

    expect(initializeCount).toBe(0);

    store.use(spec);
    expect(initializeCount).toBe(1);

    store.use(spec);
    expect(initializeCount).toBe(1);
  });

  test('should cache use instances', () => {
    const spec = createFieldMapSpec('test/spec', (t) => ({
      items: t.namedArrayToMap<{ name: string }>(),
    }));

    const store = new PluginSpecStore();
    const use1 = store.use(spec);
    const use2 = store.use(spec);

    expect(use1).toBe(use2);
  });

  test('should return default values when spec has no registrations', () => {
    const spec = createFieldMapSpec('test/spec', (t) => ({
      items: t.namedArrayToMap<{ name: string }>(),
      values: t.array<string>(),
      config: t.scalar<string>('default'),
    }));

    const store = new PluginSpecStore();
    const result = store.use(spec);

    expect(result.items.size).toBe(0);
    expect(result.values).toEqual([]);
    expect(result.config).toBe('default');
  });
});
