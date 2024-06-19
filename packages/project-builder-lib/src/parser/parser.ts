import { z } from 'zod';

import { SchemaParserContext } from './types.js';
import {
  PluginWithPlatformModules,
  initializePlugins,
} from '@src/plugins/imports/loader.js';
import { PluginStore } from '@src/plugins/imports/types.js';
import {
  ZodPluginImplementationStore,
  ZodPluginWrapper,
  createPluginConfigImplementation,
  pluginConfigSpec,
  zPluginWrapper,
} from '@src/plugins/index.js';
import { ZodRefPayload, ZodRefWrapper } from '@src/references/ref-builder.js';
import { basePluginSchema } from '@src/schema/plugins/index.js';
import {
  ProjectDefinition,
  projectDefinitionSchema,
} from '@src/schema/projectDefinition.js';

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
): ZodPluginImplementationStore {
  const { availablePlugins, getInitialSpecImplementations = () => ({}) } =
    pluginStore;
  const pluginData = z
    .object({
      plugins: z.array(basePluginSchema).optional(),
    })
    .parse(projectDefinition);
  const { plugins = [] } = pluginData;
  // initialize plugins
  const specImplementations = {
    ...getInitialSpecImplementations(),
    [pluginConfigSpec.name]: createPluginConfigImplementation(),
  };
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
      id: plugin.metadata.id,
      name: pluginName,
      pluginModules: plugin.modules,
    };
  });
  return initializePlugins(pluginsWithModules, specImplementations);
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
): ZodPluginWrapper<typeof projectDefinitionSchema> {
  const { pluginStore } = context;
  const pluginImplementationStore = createPluginImplementationStore(
    pluginStore,
    projectDefinition,
  );
  return zPluginWrapper(projectDefinitionSchema, pluginImplementationStore);
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
): ZodRefPayload<ProjectDefinition> {
  const schema = createProjectDefinitionSchemaWithContext(
    projectDefinition,
    context,
  );
  return ZodRefWrapper.create(schema).parse(projectDefinition);
}
