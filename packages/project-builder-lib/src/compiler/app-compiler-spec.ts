import type { DescriptorWithChildren } from '@halfdomelabs/sync';

import { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import {
  PluginSpecImplementation,
  createPluginSpec,
} from '@src/plugins/index.js';
import {
  AppConfig,
  AppEntryType,
  ProjectDefinition,
} from '@src/schema/index.js';
import { safeMerge } from '@src/utils/merge.js';

type AnyGeneratorDescriptor = DescriptorWithChildren & Record<string, unknown>;

export interface AppCompiler {
  addChildrenToFeature: (
    featureId: string,
    children: Record<string, AnyGeneratorDescriptor>,
  ) => void;
  getChildrenForFeature: (
    featureId: string,
  ) => Record<string, AnyGeneratorDescriptor>;
  addGlobalHoistedProviders: (providers: string[] | string) => void;
  getGlobalHoistedProviders: () => string[];
  addRootChildren: (children: Record<string, AnyGeneratorDescriptor>) => void;
  getRootChildren: () => Record<string, AnyGeneratorDescriptor>;
}

export function createAppCompiler(): AppCompiler {
  const children: Record<string, Record<string, AnyGeneratorDescriptor>> = {};
  const hoistedProviders: string[] = [];
  let rootChildren: Record<string, AnyGeneratorDescriptor> = {};

  return {
    addChildrenToFeature(featureId, newChildren) {
      children[featureId] = safeMerge(children[featureId] ?? {}, newChildren);
    },
    getChildrenForFeature(featureId) {
      return children[featureId] || {};
    },
    addGlobalHoistedProviders(providers) {
      hoistedProviders.push(
        ...(Array.isArray(providers) ? providers : [providers]),
      );
    },
    getGlobalHoistedProviders() {
      return hoistedProviders;
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
 * Spec for adding children and hoisted providers to the compilation flow
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
  const compilers: Record<string, PluginAppCompiler<unknown>[]> = {};

  return {
    registerAppCompiler(compiler) {
      if (!compilers[compiler.appType]) {
        compilers[compiler.appType] = [];
      }
      compilers[compiler.appType].push(compiler as PluginAppCompiler<unknown>);
    },
    getAppCompilers(appType) {
      return compilers[appType] ?? [];
    },
  };
}

/**
 * Spec for modifying the app compiler
 */
export const appCompilerSpec = createPluginSpec('AppCompiler', {
  defaultInitializer: createAppCompilerPlugin,
});
