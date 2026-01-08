import { describe, expect, test, vi } from 'vitest';

import type { PluginModuleWithKey } from './types.js';

import { createPluginSpec } from '../spec/types.js';
import { initializeOrderedModules, initializePlugins } from './loader.js';

const spec1 = createPluginSpec('spec-1', {
  initializer: () => ({
    init: { value: 'spec1-init' },
    use: () => ({ value: 'spec1-use' }),
  }),
});

const spec2 = createPluginSpec('spec-2', {
  initializer: () => ({
    init: { value: 'spec2-init' },
    use: () => ({ value: 'spec2-use' }),
  }),
});

function createPluginModule(
  key: string,
  pluginKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dependencies?: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialize?: (deps: any, ctx: any) => void,
): PluginModuleWithKey {
  return {
    key,
    pluginKey,
    module: {
      name: key.split('/').pop() ?? key,
      dependencies,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      initialize: initialize ?? (() => {}),
    },
  };
}

describe('initializeOrderedModules', () => {
  test('should initialize modules and return spec instances', () => {
    const modules: PluginModuleWithKey[] = [
      createPluginModule('plugin-1/main', 'plugin-1', { s1: spec1 }),
      createPluginModule('plugin-2/main', 'plugin-2', { s2: spec2 }),
    ];

    const instances = initializeOrderedModules(modules);

    expect(instances.size).toBe(2);
    expect(instances.has('spec-1')).toBe(true);
    expect(instances.has('spec-2')).toBe(true);
  });

  test('should call initialize with resolved dependencies', () => {
    const initializeSpy = vi.fn();
    const modules: PluginModuleWithKey[] = [
      createPluginModule(
        'plugin-1/main',
        'plugin-1',
        { s1: spec1 },
        initializeSpy,
      ),
    ];

    initializeOrderedModules(modules);

    expect(initializeSpy).toHaveBeenCalledWith(
      { s1: { value: 'spec1-init' } },
      { moduleKey: 'plugin-1/main', pluginKey: 'plugin-1' },
    );
  });
});

describe('initializePlugins', () => {
  test('should return a PluginSpecStore', () => {
    const modules: PluginModuleWithKey[] = [
      createPluginModule('plugin-1/main', 'plugin-1', { s1: spec1 }),
    ];

    const store = initializePlugins(modules);

    expect(store.use(spec1)).toEqual({ value: 'spec1-use' });
  });

  test('should throw on duplicate module keys', () => {
    const modules: PluginModuleWithKey[] = [
      createPluginModule('plugin-1/main', 'plugin-1'),
      createPluginModule('plugin-1/main', 'plugin-1'), // Duplicate
    ];

    expect(() => initializePlugins(modules)).toThrow(/duplicate/i);
  });
});
