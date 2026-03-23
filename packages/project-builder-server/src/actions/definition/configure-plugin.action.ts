import type {
  PluginMetadataWithPaths,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';

import {
  createDefinitionSchemaParserContext,
  createPluginSpecStore,
  createProjectDefinitionSchema,
  PluginUtils,
  ProjectDefinitionContainer,
  serializeSchema,
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
      'Optional plugin configuration object. Use get-plugin-info to see the expected schema. Defaults to empty config.',
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

export const configurePluginAction = createServiceAction({
  name: 'configure-plugin',
  title: 'Configure Plugin',
  description:
    'Enable a plugin or update its configuration in the draft session. Use get-plugin-info first to see the config schema and current config. Changes are not persisted until commit-draft is called.',
  inputSchema: configurePluginInputSchema,
  outputSchema: configurePluginOutputSchema,
  handler: async (input, context) => {
    const { session, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    const pluginMetadata = findPluginByKey(context.plugins, input.pluginKey);

    const container = ProjectDefinitionContainer.fromSerializedConfig(
      session.draftDefinition,
      parserContext,
    );

    const pluginConfig = input.config ?? {};

    const isNew =
      PluginUtils.byKey(container.definition, input.pluginKey) == null;

    // Apply setPluginConfig via produce
    const newDefinition = produce((draft: ProjectDefinition) => {
      PluginUtils.setPluginConfig(
        draft,
        pluginMetadata,
        pluginConfig,
        container,
      );
    })(container.definition);

    // When a new plugin is added, rebuild the schema to include the new
    // plugin's discriminated union variant; otherwise serialization fails
    // because the old schema has no matching discriminator for the new ID.
    let { schema } = container;
    if (isNew) {
      const newPluginStore = createPluginSpecStore(
        parserContext.pluginStore,
        newDefinition,
      );
      const defCtx = createDefinitionSchemaParserContext({
        plugins: newPluginStore,
      });
      schema = createProjectDefinitionSchema(defCtx);
    }

    // Serialize back to name-based format
    const serializedDef = serializeSchema(schema, newDefinition) as Record<
      string,
      unknown
    >;

    const { warnings } = await validateAndSaveDraft(
      serializedDef,
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
