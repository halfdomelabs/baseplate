import { z } from 'zod';

import type { PluginWithPlatformModules } from '#src/plugins/imports/loader.js';
import type { PluginStore } from '#src/plugins/imports/types.js';
import type {
  InitializedPluginSpec,
  PluginImplementationStore,
  PluginMetadataWithPaths,
  PluginSpecImplementation,
  PluginSpecWithInitializer,
} from '#src/plugins/index.js';
import type { ResolvedZodRefPayload } from '#src/references/types.js';
import type {
  ProjectDefinition,
  ProjectDefinitionSchema,
} from '#src/schema/project-definition.js';

import { initializePlugins } from '#src/plugins/imports/loader.js';
import { pluginConfigSpec } from '#src/plugins/index.js';
import { parseSchemaWithTransformedReferences } from '#src/references/parse-schema-with-references.js';
import {
  adminCrudActionSpec,
  adminCrudColumnSpec,
  adminCrudInputSpec,
  createDefinitionSchemaParserContext,
  modelTransformerSpec,
  pluginEntityType,
} from '#src/schema/index.js';
import { basePluginDefinitionSchema } from '#src/schema/plugins/definition.js';
import { createProjectDefinitionSchema } from '#src/schema/project-definition.js';

import type { SchemaParserContext } from './types.js';

const COMMON_SPEC_IMPLEMENTATIONS: (
  | InitializedPluginSpec
  | PluginSpecWithInitializer
)[] = [
  pluginConfigSpec,
  modelTransformerSpec,
  adminCrudInputSpec,
  adminCrudActionSpec,
  adminCrudColumnSpec,
];

/**
 * Creates a plugin implementation store from the project definition and plugin store,
 * initializing the set of plugins enabled in the project definition.
 *
 * @param pluginStore The plugin store to use
 * @param projectDefinition The project definition to use
 * @returns The plugin implementation store
 */
export function createPluginImplementationStore(
  pluginStore: PluginStore,
  projectDefinition: unknown,
): PluginImplementationStore {
  const { availablePlugins, builtinSpecImplementations = [] } = pluginStore;
  const pluginData = z
    .object({
      plugins: z.array(basePluginDefinitionSchema).optional(),
    })
    .parse(projectDefinition);
  const { plugins = [] } = pluginData;
  // initialize plugins
  const initialImplementations = [
    ...COMMON_SPEC_IMPLEMENTATIONS,
    ...builtinSpecImplementations,
  ];

  const specImplementations: Record<string, PluginSpecImplementation> = {};
  for (const spec of initialImplementations) {
    if ('type' in spec) {
      if (typeof spec.defaultInitializer !== 'function') {
        throw new TypeError(
          `Spec ${spec.type} does not have a defaultInitializer function!`,
        );
      }
      specImplementations[spec.name] = spec.defaultInitializer();
    } else {
      specImplementations[spec.spec.name] = spec.implementation;
    }
  }
  const pluginsWithModules = plugins.map((p): PluginWithPlatformModules => {
    const plugin = availablePlugins.find(
      ({ metadata }) =>
        metadata.name === p.name && metadata.packageName === p.packageName,
    );
    const pluginName = `${p.packageName}/${p.name}`;
    if (!plugin) {
      throw new Error(`Unable to find plugin ${pluginName}!`);
    }
    return {
      key: plugin.metadata.key,
      name: pluginName,
      pluginModules: plugin.modules,
    };
  });
  return initializePlugins(pluginsWithModules, specImplementations);
}

/**
 * Creates a plugin implementation store with the given plugins added to the project definition.
 *
 * @param pluginStore The plugin store to use
 * @param plugins The plugins to add to the project definition
 * @param projectDefinition The project definition to use
 * @returns The plugin implementation store
 */
export function createPluginImplementationStoreWithNewPlugins(
  pluginStore: PluginStore,
  plugins: PluginMetadataWithPaths[],
  projectDefinition: ProjectDefinition,
): PluginImplementationStore {
  const newProjectDefinition: ProjectDefinition = {
    ...projectDefinition,
    plugins: [
      ...(projectDefinition.plugins ?? []),
      ...plugins
        .filter(
          (p) =>
            !projectDefinition.plugins?.some(
              (p2) => p2.id === pluginEntityType.idFromKey(p.key),
            ),
        )
        .map((p) => ({
          id: pluginEntityType.idFromKey(p.key),
          version: p.version,
          name: p.name,
          packageName: p.packageName,
        })),
    ],
  };
  return createPluginImplementationStore(pluginStore, newProjectDefinition);
}

/**
 * Creates a project definition schema with the given context.
 *
 * @param projectDefinition The project definition to create a schema for
 * @param context The context to use
 * @return The project definition schema
 */
export function createProjectDefinitionSchemaWithContext(
  projectDefinition: unknown,
  context: SchemaParserContext,
): ProjectDefinitionSchema {
  const { pluginStore } = context;
  const pluginImplementationStore = createPluginImplementationStore(
    pluginStore,
    projectDefinition,
  );
  const definitionContext = createDefinitionSchemaParserContext({
    plugins: pluginImplementationStore,
  });
  return createProjectDefinitionSchema(definitionContext);
}

export function parseProjectDefinitionWithContext(
  projectDefinition: unknown,
  context: SchemaParserContext,
): ProjectDefinition {
  const schema = createProjectDefinitionSchemaWithContext(
    projectDefinition,
    context,
  );
  return schema.parse(projectDefinition);
}

/**
 * Parses a project definition and obtains entities/references from it.
 *
 * @param projectDefinition The project definition to parse
 * @param context The context to use
 * @returns The parsed project definition with entities/references
 */
export function parseProjectDefinitionWithReferences(
  projectDefinition: unknown,
  context: SchemaParserContext,
): {
  definition: ResolvedZodRefPayload<ProjectDefinition>;
  pluginStore: PluginImplementationStore;
} {
  const { pluginStore } = context;
  const pluginImplementationStore = createPluginImplementationStore(
    pluginStore,
    projectDefinition,
  );
  const definition = parseSchemaWithTransformedReferences(
    createProjectDefinitionSchema,
    projectDefinition,
    { plugins: pluginImplementationStore },
  );
  return { definition, pluginStore: pluginImplementationStore };
}
