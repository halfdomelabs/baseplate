import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

const listPluginsInputSchema = z.object({
  project: z.string().describe('The name or ID of the project.'),
});
const pluginInfoSchema = z.object({
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
});
const pluginDiscoveryErrorSchema = z.object({
  directory: z.string().describe('The directory that could not be scanned.'),
  reason: z.string().describe('Why plugin discovery failed.'),
});
const listPluginsOutputSchema = z.object({
  plugins: z.array(pluginInfoSchema).describe('Available plugins.'),
  discoveryErrors: z
    .array(pluginDiscoveryErrorSchema)
    .optional()
    .describe(
      'Directories that failed plugin discovery. When present, the plugin list is incomplete.',
    ),
});

export const listPluginsMetadata = createServiceActionMetadata({
  name: 'list-plugins',
  title: 'List Plugins',
  description:
    'List available plugins and their enabled/disabled status in the project.',
  inputSchema: listPluginsInputSchema,
  outputSchema: listPluginsOutputSchema,
  scope: 'user',
});
