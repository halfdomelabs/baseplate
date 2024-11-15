import { z } from 'zod';

import type { PluginWithPlatformModules } from '@src/plugins/imports/loader.js';
import type { PluginStore } from '@src/plugins/imports/types.js';
import type {
  InitializedPluginSpec,
  PluginImplementationStore,
  PluginSpecImplementation,
  PluginSpecWithInitializer,
  ZodPluginWrapper,
} from '@src/plugins/index.js';
import type { ZodRefPayload } from '@src/references/ref-builder.js';
import type { ProjectDefinition } from '@src/schema/project-definition.js';

import { initializePlugins } from '@src/plugins/imports/loader.js';
import { pluginConfigSpec, zPluginWrapper } from '@src/plugins/index.js';
import { ZodRefWrapper } from '@src/references/ref-builder.js';
import { adminCrudInputSpec, modelTransformerSpec } from '@src/schema/index.js';
import { basePluginSchema } from '@src/schema/plugins/index.js';
import { projectDefinitionSchema } from '@src/schema/project-definition.js';

import type { SchemaParserContext } from './types.js';

const COMMON_SPEC_IMPLEMENTATIONS: (
  | InitializedPluginSpec
  | PluginSpecWithInitializer
)[] = [pluginConfigSpec, modelTransformerSpec, adminCrudInputSpec];

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
      plugins: z.array(basePluginSchema).optional(),
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
  definition: ZodRefPayload<ProjectDefinition>;
  pluginStore: PluginImplementationStore;
} {
  const schema = createProjectDefinitionSchemaWithContext(
    projectDefinition,
    context,
  );
  const definition = ZodRefWrapper.create(schema).parse(projectDefinition);
  return { definition, pluginStore: schema._def.pluginStore };
}
