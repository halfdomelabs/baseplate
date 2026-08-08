import {
  createDefinitionSchemaParserContext,
  createPluginImplementationStoreWithNewPlugins,
  pluginConfigSpec,
  pluginEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import { createServiceAction } from '#src/actions/types.js';

import { findPluginByKey } from './find-plugin-by-key.js';
import { getPluginInfoMetadata } from './get-plugin-info.action-metadata.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';
import { schemaToTypeString } from './schema-to-type-string.js';

export const getPluginInfoAction = createServiceAction({
  ...getPluginInfoMetadata,
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
