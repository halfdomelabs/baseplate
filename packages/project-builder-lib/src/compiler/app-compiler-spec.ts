import type { GeneratorBundle } from '@baseplate-dev/sync';

import { safeMerge } from '@baseplate-dev/utils';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type {
  AppConfig,
  AppEntryType,
  ProjectDefinition,
} from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

export interface AppCompiler {
  addChildrenToFeature: (
    featureId: string,
    children: Record<string, GeneratorBundle>,
  ) => void;
  getChildrenForFeature: (
    featureId: string,
  ) => Record<string, GeneratorBundle | GeneratorBundle[]>;
  addRootChildren: (children: Record<string, GeneratorBundle>) => void;
  getRootChildren: () => Partial<
    Record<string, GeneratorBundle | GeneratorBundle[]>
  >;
}

export function createAppCompiler(): AppCompiler {
  const children: Partial<
    Record<string, Record<string, GeneratorBundle | GeneratorBundle[]>>
  > = {};
  let rootChildren: Partial<
    Record<string, GeneratorBundle | GeneratorBundle[]>
  > = {};

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

export interface PluginAppCompiler<TAppDefinition = AppConfig> {
  pluginKey: string;
  appType: AppEntryType<TAppDefinition>;
  compile: (options: PluginAppCompilerOptions<TAppDefinition>) => void;
}

/**
 * Spec for registering app compilers
 */
export const appCompilerSpec = createFieldMapSpec(
  'core/app-compiler',
  (t) => ({
    compilers: t.array<PluginAppCompiler<unknown>>(),
  }),
  {
    use: (values) => ({
      getAppCompilers: (appType: AppEntryType<unknown>) =>
        values.compilers.filter((c) => c.appType === appType),
    }),
  },
);
