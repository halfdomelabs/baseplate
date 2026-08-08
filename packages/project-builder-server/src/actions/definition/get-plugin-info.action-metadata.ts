import { z } from 'zod';

import { createServiceActionMetadata } from '#src/actions/types.js';

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

export const getPluginInfoMetadata = createServiceActionMetadata({
  name: 'get-plugin-info',
  title: 'Get Plugin Info',
  description:
    'Get detailed information about a plugin, including its config schema and current configuration. Use this before configure-plugin to understand what config fields are available.',
  inputSchema: getPluginInfoInputSchema,
  outputSchema: getPluginInfoOutputSchema,
  scope: 'user',
});
