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
} from '@baseplate-dev/project-builder-lib';
import { produce } from 'immer';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession } from './draft-session.js';
import {
  definitionIssueSchema,
  mapIssueToOutput,
  validateAndSaveDraft,
  writeIssuesCliOutput,
} from './validate-draft.js';

const configurePluginInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  pluginKey: z.string().describe('The plugin key to enable or configure.'),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      'Optional plugin configuration object. Use get-plugin-info to see the expected schema. ' +
        'Reference fields accept entity names (not IDs). IDs for nested entities are auto-generated. ' +
        'Defaults to empty config.',
    ),
});

const configurePluginOutputSchema = z.object({
  message: z.string().describe('A summary of the staged change.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues found after staging.'),
});

function findPluginByKey(
  plugins: PluginMetadataWithPaths[],
  pluginKey: string,
): PluginMetadataWithPaths {
  const plugin = plugins.find((p) => p.key === pluginKey);
  if (!plugin) {
    const available = plugins.map((p) => p.key).join(', ');
    throw new Error(
      `Plugin "${pluginKey}" not found. Available plugins: ${available}`,
    );
  }
  return plugin;
}

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
  name: 'configure-plugin',
  title: 'Configure Plugin',
  description:
    'Enable a plugin or update its configuration in the draft session. ' +
    'Use get-plugin-info first to see the config schema and current config. ' +
    'Reference fields accept entity names (not IDs). IDs for nested entities are auto-generated. ' +
    'Changes are not persisted until commit-draft is called.',
  inputSchema: configurePluginInputSchema,
  outputSchema: configurePluginOutputSchema,
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

    // Auto-generate IDs for nested entities in the config
    const rawConfig = input.config ?? {};
    const existingIds = new Set(
      serializedPlugins.map((p) => p.id as string).filter(Boolean),
    );
    const processedConfig = assignConfigEntityIds(
      rawConfig,
      pluginMetadata,
      pluginStore,
      existingIds,
    );

    // Inject the plugin config into the serialized definition.
    // This works with entity names (not IDs) — the deserialization pipeline
    // in validateAndSaveDraft handles name→ID resolution automatically.
    let updatedDef: Record<string, unknown>;

    if (isNew) {
      const pluginConfigService = pluginStore.use(pluginConfigSpec);
      const lastMigrationVersion = pluginConfigService.getLastMigrationVersion(
        pluginMetadata.key,
      );

      updatedDef = produce(serializedDef, (draft) => {
        const plugins = (draft.plugins ?? []) as Record<string, unknown>[];
        plugins.push({
          id: pluginEntityId,
          name: pluginMetadata.name,
          version: pluginMetadata.version,
          packageName: pluginMetadata.packageName,
          config: processedConfig,
          configSchemaVersion: lastMigrationVersion,
        });
        draft.plugins = plugins;
      });
    } else {
      updatedDef = produce(serializedDef, (draft) => {
        const plugins = draft.plugins as Record<string, unknown>[];
        const idx = plugins.findIndex((p) => p.id === pluginEntityId);
        if (idx !== -1) {
          plugins[idx] = { ...plugins[idx], config: processedConfig };
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
