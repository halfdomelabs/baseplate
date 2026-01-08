import { z } from 'zod';

import type {
  PluginModuleWithKey,
  PluginStore,
} from '#src/plugins/imports/types.js';
import type {
  PluginImplementationStore,
  PluginMetadataWithPaths,
} from '#src/plugins/index.js';
import type { ResolvedZodRefPayload } from '#src/references/types.js';
import type {
  ProjectDefinition,
  ProjectDefinitionSchema,
} from '#src/schema/project-definition.js';

import { initializePlugins } from '#src/plugins/imports/loader.js';
import { parseSchemaWithTransformedReferences } from '#src/references/parse-schema-with-references.js';
import {
  createDefinitionSchemaParserContext,
  pluginEntityType,
} from '#src/schema/index.js';
import { basePluginDefinitionSchema } from '#src/schema/plugins/definition.js';
import { createProjectDefinitionSchema } from '#src/schema/project-definition.js';

import type { SchemaParserContext } from './types.js';

// [TODO: 2025-01-01] Rename createPluginImplementationStore to PluginImplementationStore

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
  const { availablePlugins, coreModules } = pluginStore;
  const pluginData = z
    .object({
      plugins: z.array(basePluginDefinitionSchema).optional(),
    })
    .parse(projectDefinition);
  const { plugins = [] } = pluginData;
  // initialize plugins
  const modulesWithKey = plugins.flatMap((p): PluginModuleWithKey[] => {
    const plugin = availablePlugins.find(
      ({ metadata }) =>
        metadata.name === p.name && metadata.packageName === p.packageName,
    );
    if (!plugin) {
      throw new Error(`Unable to find plugin ${p.packageName}/${p.name}!`);
    }
    return plugin.modules.map((m) => ({
      key: `${plugin.metadata.key}/${m.directory}/${m.module.name}`,
      pluginKey: plugin.metadata.key,
      module: m.module,
    }));
  });
  return initializePlugins([...modulesWithKey, ...coreModules]);
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
          config: undefined,
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
