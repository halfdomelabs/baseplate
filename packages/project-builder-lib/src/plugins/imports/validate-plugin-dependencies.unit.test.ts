import { describe, expect, it } from 'vitest';

import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type { PluginStore } from './types.js';

import {
  getPluginDependencies,
  getUnmetPluginDependencies,
  validatePluginDependencyGraph,
} from './validate-plugin-dependencies.js';

function createMockPlugin(
  name: string,
  fullyQualifiedName: string,
  pluginDependencies?: { plugin: string; optional?: boolean }[],
): PluginStore['availablePlugins'][number] {
  return {
    metadata: {
      key: name,
      name,
      displayName: name,
      description: `${name} plugin`,
      version: '0.1.0',
      packageName: `@baseplate-dev/plugin-${name}`,
      fullyQualifiedName,
      pluginDirectory: `/plugins/${name}`,
      webBuildDirectory: `/plugins/${name}/web`,
      nodeModulePaths: [],
      webModulePaths: [],
      pluginDependencies,
    } as PluginMetadataWithPaths,
    modules: [],
  };
}

describe('validatePluginDependencyGraph', () => {
  it('should pass with no dependencies', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('storage', '@test/plugin-storage:storage'),
    ];

    expect(() => {
      validatePluginDependencyGraph(plugins);
    }).not.toThrow();
  });

  it('should pass with valid linear dependencies', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('rate-limit', '@test/plugin-rate-limit:rate-limit', [
        { plugin: '@test/plugin-auth:auth' },
      ]),
    ];

    expect(() => {
      validatePluginDependencyGraph(plugins);
    }).not.toThrow();
  });

  it('should detect a simple circular dependency', () => {
    const plugins = [
      createMockPlugin('a', '@test/plugin-a:a', [
        { plugin: '@test/plugin-b:b' },
      ]),
      createMockPlugin('b', '@test/plugin-b:b', [
        { plugin: '@test/plugin-a:a' },
      ]),
    ];

    expect(() => {
      validatePluginDependencyGraph(plugins);
    }).toThrow(/Cyclical dependency detected/);
  });

  it('should detect a longer circular dependency chain', () => {
    const plugins = [
      createMockPlugin('a', '@test/plugin-a:a', [
        { plugin: '@test/plugin-b:b' },
      ]),
      createMockPlugin('b', '@test/plugin-b:b', [
        { plugin: '@test/plugin-c:c' },
      ]),
      createMockPlugin('c', '@test/plugin-c:c', [
        { plugin: '@test/plugin-a:a' },
      ]),
    ];

    expect(() => {
      validatePluginDependencyGraph(plugins);
    }).toThrow(/Cyclical dependency detected/);
  });

  it('should include optional dependencies in cycle detection', () => {
    const plugins = [
      createMockPlugin('a', '@test/plugin-a:a', [
        { plugin: '@test/plugin-b:b', optional: true },
      ]),
      createMockPlugin('b', '@test/plugin-b:b', [
        { plugin: '@test/plugin-a:a' },
      ]),
    ];

    expect(() => {
      validatePluginDependencyGraph(plugins);
    }).toThrow(/Cyclical dependency detected/);
  });

  it('should skip dependencies referencing unavailable plugins', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth', [
        { plugin: '@test/plugin-missing:missing' },
      ]),
    ];

    expect(() => {
      validatePluginDependencyGraph(plugins);
    }).not.toThrow();
  });

  it('should pass with a valid DAG (diamond dependency)', () => {
    const plugins = [
      createMockPlugin('base', '@test/plugin-base:base'),
      createMockPlugin('left', '@test/plugin-left:left', [
        { plugin: '@test/plugin-base:base' },
      ]),
      createMockPlugin('right', '@test/plugin-right:right', [
        { plugin: '@test/plugin-base:base' },
      ]),
      createMockPlugin('top', '@test/plugin-top:top', [
        { plugin: '@test/plugin-left:left' },
        { plugin: '@test/plugin-right:right' },
      ]),
    ];

    expect(() => {
      validatePluginDependencyGraph(plugins);
    }).not.toThrow();
  });
});

describe('getPluginDependencies', () => {
  it('should return empty array for plugin with no dependencies', () => {
    const plugins = [createMockPlugin('auth', '@test/plugin-auth:auth')];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };

    const result = getPluginDependencies(store, 'auth');
    expect(result).toEqual([]);
  });

  it('should resolve plugin dependencies to metadata', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('rate-limit', '@test/plugin-rate-limit:rate-limit', [
        { plugin: '@test/plugin-auth:auth' },
      ]),
    ];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };

    const result = getPluginDependencies(store, 'rate-limit');
    expect(result).toHaveLength(1);
    expect(result[0]?.metadata.key).toBe('auth');
    expect(result[0]?.optional).toBe(false);
  });

  it('should mark optional dependencies correctly', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('rate-limit', '@test/plugin-rate-limit:rate-limit', [
        { plugin: '@test/plugin-auth:auth', optional: true },
      ]),
    ];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };

    const result = getPluginDependencies(store, 'rate-limit');
    expect(result).toHaveLength(1);
    expect(result[0]?.optional).toBe(true);
  });

  it('should skip unresolvable dependencies', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth', [
        { plugin: '@test/plugin-missing:missing' },
      ]),
    ];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };

    const result = getPluginDependencies(store, 'auth');
    expect(result).toEqual([]);
  });

  it('should return empty array for unknown plugin key', () => {
    const plugins = [createMockPlugin('auth', '@test/plugin-auth:auth')];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };

    const result = getPluginDependencies(store, 'nonexistent');
    expect(result).toEqual([]);
  });
});

describe('getUnmetPluginDependencies', () => {
  it('should return empty array when all deps are enabled', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('rate-limit', '@test/plugin-rate-limit:rate-limit', [
        { plugin: '@test/plugin-auth:auth' },
      ]),
    ];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };
    const enabledFqns = new Set(['@test/plugin-auth:auth']);

    const result = getUnmetPluginDependencies(store, 'rate-limit', enabledFqns);
    expect(result).toEqual([]);
  });

  it('should return unmet required dependencies', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('rate-limit', '@test/plugin-rate-limit:rate-limit', [
        { plugin: '@test/plugin-auth:auth' },
      ]),
    ];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };
    const enabledFqns = new Set<string>();

    const result = getUnmetPluginDependencies(store, 'rate-limit', enabledFqns);
    expect(result).toHaveLength(1);
    expect(result[0]?.key).toBe('auth');
  });

  it('should exclude optional dependencies', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('rate-limit', '@test/plugin-rate-limit:rate-limit', [
        { plugin: '@test/plugin-auth:auth', optional: true },
      ]),
    ];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };
    const enabledFqns = new Set<string>();

    const result = getUnmetPluginDependencies(store, 'rate-limit', enabledFqns);
    expect(result).toEqual([]);
  });

  it('should return multiple unmet dependencies', () => {
    const plugins = [
      createMockPlugin('auth', '@test/plugin-auth:auth'),
      createMockPlugin('storage', '@test/plugin-storage:storage'),
      createMockPlugin('app', '@test/plugin-app:app', [
        { plugin: '@test/plugin-auth:auth' },
        { plugin: '@test/plugin-storage:storage' },
      ]),
    ];
    const store: PluginStore = { availablePlugins: plugins, coreModules: [] };
    const enabledFqns = new Set<string>();

    const result = getUnmetPluginDependencies(store, 'app', enabledFqns);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.key)).toEqual(['auth', 'storage']);
  });
});
