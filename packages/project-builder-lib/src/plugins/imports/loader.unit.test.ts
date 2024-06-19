import { describe, expect, test } from 'vitest';

import {
  PluginWithPlatformModules,
  extractPlatformModulesFromPlugins,
  getOrderedPluginModuleInitializationSteps,
  initializeOrderedPluginModules,
} from './loader.js';
import { PluginPlatformModule } from './types.js';
import { createPluginSpec } from '../spec/types.js';

const builtInSpec = createPluginSpec('built-in-spec');
const spec1 = createPluginSpec('spec-1');
const spec2 = createPluginSpec('spec-2');
const spec3 = createPluginSpec('spec-3');

function createPlugin({
  idx,
  dependencies,
  exports,
  initialize,
}: { idx: number } & Partial<PluginPlatformModule>): PluginWithPlatformModules {
  return {
    id: `plugin-${idx}`,
    name: `Plugin ${idx}`,
    pluginModules: [
      {
        key: 'main',
        module: {
          dependencies: dependencies,
          exports: exports,
          initialize:
            initialize ??
            (() => {
              /* no-op */
            }),
        },
      },
    ],
  };
}

describe('getOrderedPluginInitializationSteps', () => {
  test('should return an array of plugin IDs in the correct order', () => {
    const plugins = [
      createPlugin({
        idx: 1,
        dependencies: { i1: spec1 },
        exports: { i2: spec2 },
      }),
      createPlugin({
        idx: 2,
        dependencies: { built: builtInSpec },
        exports: { spec: spec1 },
      }),
      createPlugin({
        idx: 3,
        dependencies: { i1: spec1, i2: spec2 },
        exports: { i3: spec3 },
      }),
    ];
    const initialSpecImplementations = { [builtInSpec.name]: {} };
    const expectedOrder = ['plugin-2/main', 'plugin-1/main', 'plugin-3/main'];

    const pluginModules = extractPlatformModulesFromPlugins(plugins);

    expect(
      getOrderedPluginModuleInitializationSteps(
        pluginModules,
        initialSpecImplementations,
      ),
    ).toEqual(expectedOrder);
  });
});

describe('initializeOrderedPlugins', () => {
  test('should initialize plugins and return the implementations', () => {
    const builtInImplementation = { a: Symbol() };
    const implementation1 = { a: Symbol() };
    const implementation2 = { a: Symbol() };
    const initialSpecImplementations = {
      [builtInSpec.name]: builtInImplementation,
    };
    const plugins = [
      createPlugin({
        idx: 1,
        dependencies: { builtIn: builtInSpec },
        exports: { exp: spec1 },
        initialize: (deps) => {
          expect(deps.builtIn).toBe(builtInImplementation);
          return { exp: implementation1 };
        },
      }),
      createPlugin({
        idx: 2,
        dependencies: { i1: spec1 },
        exports: { i2: spec2 },
        initialize: (deps) => {
          expect(deps.i1).toBe(implementation1);
          return { i2: implementation2 };
        },
      }),
    ];
    const expectedStore = {
      [builtInSpec.name]: builtInImplementation,
      [spec1.name]: implementation1,
      [spec2.name]: implementation2,
    };

    const pluginModules = extractPlatformModulesFromPlugins(plugins);

    expect(
      initializeOrderedPluginModules(pluginModules, initialSpecImplementations),
    ).toEqual(expectedStore);
  });
});
