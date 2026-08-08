import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

import { definitionIssueSchema } from './definition-issue-schema.js';

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

export const disablePluginMetadata = createServiceActionMetadata({
  name: 'disable-plugin',
  title: 'Disable Plugin',
  description:
    'Disable a plugin in the draft session. Also disables any plugins managed by this plugin. Changes are not persisted until commit-draft is called.',
  inputSchema: disablePluginInputSchema,
  outputSchema: disablePluginOutputSchema,
  scope: 'user',
});
