import type { ProjectDefinition } from '@baseplate-dev/project-builder-lib';

import {
  PluginUtils,
  ProjectDefinitionContainer,
  serializeSchema,
} from '@baseplate-dev/project-builder-lib';
import { produce } from 'immer';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { getOrCreateDraftSession, saveDraftSession } from './draft-session.js';
import {
  definitionIssueSchema,
  fixAndValidateDraftDefinition,
  mapIssueToOutput,
} from './validate-draft.js';

const disablePluginInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
  pluginKey: z.string().describe('The plugin key to disable.'),
});

const disablePluginOutputSchema = z.object({
  message: z.string().describe('A summary of the staged change.'),
  issues: z
    .array(definitionIssueSchema)
    .optional()
    .describe('Definition issues found after staging.'),
});

export const disablePluginAction = createServiceAction({
  name: 'disable-plugin',
  title: 'Disable Plugin',
  description:
    'Disable a plugin in the draft session. Also disables any plugins managed by this plugin. Changes are not persisted until commit-draft is called.',
  inputSchema: disablePluginInputSchema,
  outputSchema: disablePluginOutputSchema,
  handler: async (input, context) => {
    const { session, parserContext, projectDirectory } =
      await getOrCreateDraftSession(input.project, context);

    const container = ProjectDefinitionContainer.fromSerializedConfig(
      session.draftDefinition,
      parserContext,
    );

    // Verify the plugin is currently enabled
    const existingPlugin = PluginUtils.byKey(
      container.definition,
      input.pluginKey,
    );
    if (!existingPlugin) {
      throw new Error(`Plugin "${input.pluginKey}" is not currently enabled.`);
    }

    // Apply disablePlugin via produce
    const newDefinition = produce((draft: ProjectDefinition) => {
      PluginUtils.disablePlugin(draft, input.pluginKey, parserContext);
    })(container.definition);

    // Serialize back to name-based format
    const serializedDef = serializeSchema(
      container.schema,
      newDefinition,
    ) as Record<string, unknown>;

    // Validate
    const { fixedSerializedDefinition, errors, warnings } =
      fixAndValidateDraftDefinition(serializedDef, parserContext);

    if (errors.length > 0) {
      const messages = errors.map((e) => e.message).join('; ');
      throw new Error(`Staging blocked by definition errors: ${messages}`);
    }

    session.draftDefinition = fixedSerializedDefinition;
    await saveDraftSession(projectDirectory, session);

    return {
      message: `Disabled plugin "${input.pluginKey}". Use commit-draft to persist.`,
      issues: warnings.length > 0 ? warnings.map(mapIssueToOutput) : undefined,
    };
  },
  writeCliOutput: (output) => {
    console.info(`✓ ${output.message}`);
    if (output.issues) {
      for (const issue of output.issues) {
        console.warn(`  ⚠ ${issue.message}`);
      }
    }
  },
});
