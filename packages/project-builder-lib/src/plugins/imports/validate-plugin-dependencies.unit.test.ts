import { describe, expect, it } from 'vitest';

import {
  createMockPluginMetadata,
  createMockPluginStore,
} from '#src/testing/index.js';

import {
  getPluginDependencies,
  getUnmetPluginDependencies,
  validatePluginDependencyGraph,
} from './validate-plugin-dependencies.js';

describe('validatePluginDependencyGraph', () => {
  it('should pass with no dependencies', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata('storage', '@test/plugin-storage:storage'),
    ]);

    expect(() => {
      validatePluginDependencyGraph(store.availablePlugins);
    }).not.toThrow();
  });

  it('should pass with valid linear dependencies', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata(
        'rate-limit',
        '@test/plugin-rate-limit:rate-limit',
        { pluginDependencies: [{ plugin: '@test/plugin-auth:auth' }] },
      ),
    ]);

    expect(() => {
      validatePluginDependencyGraph(store.availablePlugins);
    }).not.toThrow();
  });

  it('should detect a simple circular dependency', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('a', '@test/plugin-a:a', {
        pluginDependencies: [{ plugin: '@test/plugin-b:b' }],
      }),
      createMockPluginMetadata('b', '@test/plugin-b:b', {
        pluginDependencies: [{ plugin: '@test/plugin-a:a' }],
      }),
    ]);

    expect(() => {
      validatePluginDependencyGraph(store.availablePlugins);
    }).toThrow(/Cyclical dependency detected/);
  });

  it('should detect a longer circular dependency chain', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('a', '@test/plugin-a:a', {
        pluginDependencies: [{ plugin: '@test/plugin-b:b' }],
      }),
      createMockPluginMetadata('b', '@test/plugin-b:b', {
        pluginDependencies: [{ plugin: '@test/plugin-c:c' }],
      }),
      createMockPluginMetadata('c', '@test/plugin-c:c', {
        pluginDependencies: [{ plugin: '@test/plugin-a:a' }],
      }),
    ]);

    expect(() => {
      validatePluginDependencyGraph(store.availablePlugins);
    }).toThrow(/Cyclical dependency detected/);
  });

  it('should include optional dependencies in cycle detection', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('a', '@test/plugin-a:a', {
        pluginDependencies: [{ plugin: '@test/plugin-b:b', optional: true }],
      }),
      createMockPluginMetadata('b', '@test/plugin-b:b', {
        pluginDependencies: [{ plugin: '@test/plugin-a:a' }],
      }),
    ]);

    expect(() => {
      validatePluginDependencyGraph(store.availablePlugins);
    }).toThrow(/Cyclical dependency detected/);
  });

  it('should skip dependencies referencing unavailable plugins', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth', {
        pluginDependencies: [{ plugin: '@test/plugin-missing:missing' }],
      }),
    ]);

    expect(() => {
      validatePluginDependencyGraph(store.availablePlugins);
    }).not.toThrow();
  });

  it('should pass with a valid DAG (diamond dependency)', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('base', '@test/plugin-base:base'),
      createMockPluginMetadata('left', '@test/plugin-left:left', {
        pluginDependencies: [{ plugin: '@test/plugin-base:base' }],
      }),
      createMockPluginMetadata('right', '@test/plugin-right:right', {
        pluginDependencies: [{ plugin: '@test/plugin-base:base' }],
      }),
      createMockPluginMetadata('top', '@test/plugin-top:top', {
        pluginDependencies: [
          { plugin: '@test/plugin-left:left' },
          { plugin: '@test/plugin-right:right' },
        ],
      }),
    ]);

    expect(() => {
      validatePluginDependencyGraph(store.availablePlugins);
    }).not.toThrow();
  });
});

describe('getPluginDependencies', () => {
  it('should return empty array for plugin with no dependencies', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
    ]);

    const result = getPluginDependencies(store, 'auth');
    expect(result).toEqual([]);
  });

  it('should resolve plugin dependencies to metadata', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata(
        'rate-limit',
        '@test/plugin-rate-limit:rate-limit',
        { pluginDependencies: [{ plugin: '@test/plugin-auth:auth' }] },
      ),
    ]);

    const result = getPluginDependencies(store, 'rate-limit');
    expect(result).toHaveLength(1);
    expect(result[0]?.metadata.key).toBe('auth');
    expect(result[0]?.optional).toBe(false);
  });

  it('should mark optional dependencies correctly', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata(
        'rate-limit',
        '@test/plugin-rate-limit:rate-limit',
        {
          pluginDependencies: [
            { plugin: '@test/plugin-auth:auth', optional: true },
          ],
        },
      ),
    ]);

    const result = getPluginDependencies(store, 'rate-limit');
    expect(result).toHaveLength(1);
    expect(result[0]?.optional).toBe(true);
  });

  it('should skip unresolvable dependencies', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth', {
        pluginDependencies: [{ plugin: '@test/plugin-missing:missing' }],
      }),
    ]);

    const result = getPluginDependencies(store, 'auth');
    expect(result).toEqual([]);
  });

  it('should return empty array for unknown plugin key', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
    ]);

    const result = getPluginDependencies(store, 'nonexistent');
    expect(result).toEqual([]);
  });
});

describe('getUnmetPluginDependencies', () => {
  it('should return empty array when all deps are enabled', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata(
        'rate-limit',
        '@test/plugin-rate-limit:rate-limit',
        { pluginDependencies: [{ plugin: '@test/plugin-auth:auth' }] },
      ),
    ]);
    const enabledFqns = new Set(['@test/plugin-auth:auth']);

    const result = getUnmetPluginDependencies(store, 'rate-limit', enabledFqns);
    expect(result).toEqual([]);
  });

  it('should return unmet required dependencies', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata(
        'rate-limit',
        '@test/plugin-rate-limit:rate-limit',
        { pluginDependencies: [{ plugin: '@test/plugin-auth:auth' }] },
      ),
    ]);
    const enabledFqns = new Set<string>();

    const result = getUnmetPluginDependencies(store, 'rate-limit', enabledFqns);
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('auth');
  });

  it('should exclude optional dependencies', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata(
        'rate-limit',
        '@test/plugin-rate-limit:rate-limit',
        {
          pluginDependencies: [
            { plugin: '@test/plugin-auth:auth', optional: true },
          ],
        },
      ),
    ]);
    const enabledFqns = new Set<string>();

    const result = getUnmetPluginDependencies(store, 'rate-limit', enabledFqns);
    expect(result).toEqual([]);
  });

  it('should return multiple unmet dependencies', () => {
    const store = createMockPluginStore([
      createMockPluginMetadata('auth', '@test/plugin-auth:auth'),
      createMockPluginMetadata('storage', '@test/plugin-storage:storage'),
      createMockPluginMetadata('app', '@test/plugin-app:app', {
        pluginDependencies: [
          { plugin: '@test/plugin-auth:auth' },
          { plugin: '@test/plugin-storage:storage' },
        ],
      }),
    ]);
    const enabledFqns = new Set<string>();

    const result = getUnmetPluginDependencies(store, 'app', enabledFqns);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.key)).toEqual(['auth', 'storage']);
  });
});
