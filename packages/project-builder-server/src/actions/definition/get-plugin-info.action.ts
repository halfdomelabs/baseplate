import type { PluginMetadataWithPaths } from '@baseplate-dev/project-builder-lib';

import {
  createDefinitionSchemaParserContext,
  createPluginImplementationStoreWithNewPlugins,
  pluginConfigSpec,
  pluginEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { loadEntityServiceContext } from './load-entity-service-context.js';
import { schemaToTypeString } from './schema-to-type-string.js';

const getPluginInfoInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  pluginKey: z.string().describe('The unique plugin key.'),
});

const pluginDependencySchema = z.object({
  plugin: z.string().describe('Fully qualified name of the dependency plugin.'),
  optional: z
    .boolean()
    .optional()
    .describe('Whether this dependency is optional.'),
});

const getPluginInfoOutputSchema = z.object({
  key: z.string().describe('The unique plugin key.'),
  name: z.string().describe('The plugin name.'),
  displayName: z.string().describe('Human-readable display name.'),
  description: z.string().describe('Plugin description.'),
  packageName: z.string().describe('The npm package name.'),
  version: z.string().describe('The plugin version.'),
  enabled: z.boolean().describe('Whether the plugin is currently enabled.'),
  managedBy: z
    .string()
    .optional()
    .describe(
      'Fully qualified name of the plugin that manages this one, if any.',
    ),
  pluginDependencies: z
    .array(pluginDependencySchema)
    .optional()
    .describe('Plugins that this plugin depends on.'),
  configSchema: z
    .string()
    .nullable()
    .describe(
      'TypeScript type representation of the config schema, or null if no config schema exists.',
    ),
  currentConfig: z
    .unknown()
    .nullable()
    .describe(
      'The current config for this plugin if enabled, or null if not enabled.',
    ),
});

function findPluginByKey(
  plugins: PluginMetadataWithPaths[],
  pluginKey: string,
): PluginMetadataWithPaths {
  const plugin = plugins.find((p) => p.key === pluginKey);
  if (!plugin) {
    const available = plugins
      .filter((p) => !p.hidden)
      .map((p) => p.key)
      .join(', ');
    throw new Error(
      `Plugin "${pluginKey}" not found. Available plugins: ${available}`,
    );
  }
  return plugin;
}

export const getPluginInfoAction = createServiceAction({
  name: 'get-plugin-info',
  title: 'Get Plugin Info',
  description:
    'Get detailed information about a plugin, including its config schema and current configuration. Use this before configure-plugin to understand what config fields are available.',
  inputSchema: getPluginInfoInputSchema,
  outputSchema: getPluginInfoOutputSchema,
  writeCliOutput: (output) => {
    console.info(`Plugin: ${output.displayName} [${output.key}]`);
    console.info(`  Package: ${output.packageName}@${output.version}`);
    console.info(`  Enabled: ${output.enabled ? 'Yes' : 'No'}`);
    if (output.managedBy) {
      console.info(`  Managed by: ${output.managedBy}`);
    }
    if (output.pluginDependencies?.length) {
      console.info(`  Dependencies:`);
      for (const dep of output.pluginDependencies) {
        console.info(`    - ${dep.plugin}${dep.optional ? ' (optional)' : ''}`);
      }
    }
    if (output.configSchema) {
      console.info(`  Config schema:`);
      console.info(`    ${output.configSchema}`);
    }
    if (output.currentConfig != null) {
      console.info(`  Current config:`);
      console.info(`    ${JSON.stringify(output.currentConfig, null, 2)}`);
    }
  },
  handler: async (input, context) => {
    const { entityContext, container } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const pluginMetadata = findPluginByKey(context.plugins, input.pluginKey);

    // Check if enabled
    const enabled =
      PluginUtils.byKey(container.definition, input.pluginKey) != null;

    // Get config schema via zodToTs.
    // When the plugin is not enabled, its config spec isn't registered in the
    // current plugin store. Create a temporary store that includes the target
    // plugin so we can still retrieve its schema creator.
    const pluginStore = enabled
      ? container.pluginStore
      : createPluginImplementationStoreWithNewPlugins(
          container.parserContext.pluginStore,
          [pluginMetadata],
          container.definition,
        );
    const pluginConfigService = pluginStore.use(pluginConfigSpec);
    const schemaCreator = pluginConfigService.getSchemaCreator(
      pluginMetadata.key,
    );
    let configSchema: string | null = null;
    if (schemaCreator) {
      const defCtx = createDefinitionSchemaParserContext({
        plugins: pluginStore,
      });
      const zodSchema = schemaCreator(defCtx);
      configSchema = schemaToTypeString(zodSchema);
    }

    // Get current config from serialized definition
    let currentConfig: unknown = null;
    if (enabled) {
      const pluginEntityId = pluginEntityType.idFromKey(pluginMetadata.key);
      const serializedPlugins = entityContext.serializedDefinition.plugins as
        | Record<string, unknown>[]
        | undefined;
      const pluginDef = serializedPlugins?.find((p) => p.id === pluginEntityId);
      currentConfig = pluginDef?.config ?? null;
    }

    return {
      key: pluginMetadata.key,
      name: pluginMetadata.name,
      displayName: pluginMetadata.displayName,
      description: pluginMetadata.description,
      packageName: pluginMetadata.packageName,
      version: pluginMetadata.version,
      enabled,
      managedBy: pluginMetadata.managedBy,
      pluginDependencies: pluginMetadata.pluginDependencies?.length
        ? pluginMetadata.pluginDependencies
        : undefined,
      configSchema,
      currentConfig,
    };
  },
});
