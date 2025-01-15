import type { GeneratorBundle } from '@halfdomelabs/sync';

import { safeMerge } from '@halfdomelabs/utils';

import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import type { PluginSpecImplementation } from '@src/plugins/index.js';
import type {
  AppConfig,
  AppEntryType,
  ProjectDefinition,
} from '@src/schema/index.js';

import { createPluginSpec } from '@src/plugins/index.js';

export interface AppCompiler {
  addChildrenToFeature: (
    featureId: string,
    children: Record<string, GeneratorBundle>,
  ) => void;
  getChildrenForFeature: (featureId: string) => Record<string, GeneratorBundle>;
  addRootChildren: (children: Record<string, GeneratorBundle>) => void;
  getRootChildren: () => Partial<Record<string, GeneratorBundle>>;
}

export function createAppCompiler(): AppCompiler {
  const children: Partial<Record<string, Record<string, GeneratorBundle>>> = {};
  let rootChildren: Partial<Record<string, GeneratorBundle>> = {};

  return {
    addChildrenToFeature(featureId, newChildren) {
      children[featureId] = safeMerge(children[featureId] ?? {}, newChildren);
    },
    getChildrenForFeature(featureId) {
      return children[featureId] ?? {};
    },
    addRootChildren(newChildren) {
      rootChildren = safeMerge(rootChildren, newChildren);
    },
    getRootChildren() {
      return rootChildren;
    },
  };
}

interface PluginAppCompilerOptions<TAppDefinition> {
  appDefinition: TAppDefinition;
  appCompiler: AppCompiler;
  projectDefinition: ProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
}

interface PluginAppCompiler<TAppDefinition = AppConfig> {
  pluginId: string;
  appType: AppEntryType<TAppDefinition>;
  compile: (options: PluginAppCompilerOptions<TAppDefinition>) => void;
}

/**
 * Spec for adding children to the compilation flow
 */
export interface AppCompilerSpec extends PluginSpecImplementation {
  registerAppCompiler: <TAppDefinition>(
    compiler: PluginAppCompiler<TAppDefinition>,
  ) => void;
  getAppCompilers: (
    appType: AppEntryType<unknown>,
  ) => PluginAppCompiler<unknown>[];
}

export function createAppCompilerPlugin(): AppCompilerSpec {
  const compilers = new Map<string, PluginAppCompiler<unknown>[]>();

  return {
    registerAppCompiler(compiler) {
      const appCompilers = compilers.get(compiler.appType) ?? [];
      if (!compilers.has(compiler.appType)) {
        compilers.set(compiler.appType, appCompilers);
      }
      appCompilers.push(compiler as PluginAppCompiler<unknown>);
    },
    getAppCompilers(appType) {
      return compilers.get(appType) ?? [];
    },
  };
}

/**
 * Spec for modifying the app compiler
 */
export const appCompilerSpec = createPluginSpec('AppCompiler', {
  defaultInitializer: createAppCompilerPlugin,
});
