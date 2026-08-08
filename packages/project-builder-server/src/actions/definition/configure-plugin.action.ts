import type {
  PluginMetadataWithPaths,
  PluginSpecStore,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';

import {
  assignEntityIds,
  createDefinitionSchemaParserContext,
  createPluginImplementationStoreWithNewPlugins,
  pluginConfigSpec,
  pluginEntityType,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import { produce } from 'immer';

import { createServiceAction } from '#src/actions/types.js';

import { configurePluginMetadata } from './configure-plugin.action-metadata.js';
import { getOrCreateDraftSession } from './draft-session.js';
import { findPluginByKey } from './find-plugin-by-key.js';
import {
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

/**
 * Auto-generates IDs for nested entities in a plugin config using the
 * plugin's config schema. Existing IDs are preserved.
 */
function assignConfigEntityIds(
  pluginConfig: Record<string, unknown>,
  pluginMetadata: PluginMetadataWithPaths,
  pluginStore: PluginSpecStore,
  existingIds: Set<string>,
): Record<string, unknown> {
  const pluginConfigService = pluginStore.use(pluginConfigSpec);
  const schemaCreator = pluginConfigService.getSchemaCreator(
    pluginMetadata.key,
  );
  if (!schemaCreator) {
    return pluginConfig;
  }

  const defCtx = createDefinitionSchemaParserContext({ plugins: pluginStore });
  const configSchema = schemaCreator(defCtx);

  return assignEntityIds(configSchema, pluginConfig, {
    isExistingId: (id) => existingIds.has(id),
  });
}

export const configurePluginAction = createServiceAction({
  ...configurePluginMetadata,
  handler: async (input, context) => {
    const { session, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    const pluginMetadata = findPluginByKey(context.plugins, input.pluginKey);

    const pluginEntityId = pluginEntityType.idFromKey(pluginMetadata.key);
    const serializedDef = session.draftDefinition;
    const serializedPlugins = (serializedDef.plugins ?? []) as Record<
      string,
      unknown
    >[];

    const isNew = !serializedPlugins.some((p) => p.id === pluginEntityId);

    // Build a plugin store that includes this plugin (needed for schema
    // creation and migration version lookup even if the plugin is new).
    // Cast is safe: only the plugins[] array is accessed for ID matching.
    const pluginStore = createPluginImplementationStoreWithNewPlugins(
      parserContext.pluginStore,
      [pluginMetadata],
      serializedDef as unknown as ProjectDefinition,
    );

    // Collect all existing entity IDs from the definition so that
    // assignEntityIds can preserve them and avoid collisions.
    const defContainer = ProjectDefinitionContainer.fromSerializedConfig(
      serializedDef,
      parserContext,
    );
    const existingIds = new Set([
      ...defContainer.entities.map((e) => e.id),
      pluginEntityId,
    ]);

    // Auto-generate IDs for nested entities in the config
    const rawConfig = input.config ?? {};
    const processedConfig = assignConfigEntityIds(
      rawConfig,
      pluginMetadata,
      pluginStore,
      existingIds,
    );

    // Inject the plugin config into the serialized definition.
    // This works with entity names (not IDs) — the deserialization pipeline
    // in validateAndSaveDraft handles name→ID resolution automatically.
    const pluginConfigService = pluginStore.use(pluginConfigSpec);
    const lastMigrationVersion = pluginConfigService.getLastMigrationVersion(
      pluginMetadata.key,
    );

    let updatedDef: Record<string, unknown>;

    if (isNew) {
      const newPlugin: Record<string, unknown> = {
        id: pluginEntityId,
        name: pluginMetadata.name,
        version: pluginMetadata.version,
        packageName: pluginMetadata.packageName,
        config: processedConfig,
      };
      if (lastMigrationVersion !== undefined) {
        newPlugin.configSchemaVersion = lastMigrationVersion;
      }

      updatedDef = produce(serializedDef, (draft) => {
        const plugins = (draft.plugins ?? []) as Record<string, unknown>[];
        plugins.push(newPlugin);
        draft.plugins = plugins;
      });
    } else {
      updatedDef = produce(serializedDef, (draft) => {
        const plugins = draft.plugins as Record<string, unknown>[];
        const idx = plugins.findIndex((p) => p.id === pluginEntityId);
        if (idx !== -1) {
          const updated: Record<string, unknown> = {
            ...plugins[idx],
            config: processedConfig,
          };
          if (lastMigrationVersion === undefined) {
            delete updated.configSchemaVersion;
          } else {
            updated.configSchemaVersion = lastMigrationVersion;
          }
          plugins[idx] = updated;
        }
      });
    }

    const { warnings } = await validateAndSaveDraft(
      updatedDef,
      parserContext,
      session,
      projectDirectory,
    );

    const action = isNew ? 'Enabled' : 'Updated configuration for';

    return {
      message: `${action} plugin "${pluginMetadata.displayName}". Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: writeIssuesCliOutput,
});
