import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

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

export const configurePluginMetadata = createServiceActionMetadata({
  name: 'configure-plugin',
  title: 'Configure Plugin',
  description:
    'Enable a plugin or update its configuration in the draft session. ' +
    'Use get-plugin-info first to see the config schema and current config. ' +
    'Reference fields accept entity names (not IDs). IDs for nested entities are auto-generated. ' +
    'Changes are not persisted until commit-draft is called.',
  inputSchema: configurePluginInputSchema,
  outputSchema: configurePluginOutputSchema,
  scope: 'user',
});
