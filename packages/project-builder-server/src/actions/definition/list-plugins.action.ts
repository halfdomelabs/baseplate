import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

import { createServiceAction } from '#src/actions/types.js';

import { loadEntityServiceContext } from './load-entity-service-context.js';

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

const listPluginsOutputSchema = z.object({
  plugins: z.array(pluginInfoSchema).describe('Available plugins.'),
});

export const listPluginsAction = createServiceAction({
  name: 'list-plugins',
  title: 'List Plugins',
  description:
    'List available plugins and their enabled/disabled status in the project.',
  inputSchema: listPluginsInputSchema,
  outputSchema: listPluginsOutputSchema,
  writeCliOutput: (output) => {
    for (const plugin of output.plugins) {
      const status = plugin.enabled ? '✓' : '○';
      const managed = plugin.managedBy
        ? ` (managed by ${plugin.managedBy})`
        : '';
      console.info(
        `  ${status} ${plugin.displayName} [${plugin.key}]${managed}`,
      );
    }
  },
  handler: async (input, context) => {
    const { container } = await loadEntityServiceContext(
      input.project,
      context,
    );

    const plugins = context.plugins
      .filter((p) => !p.hidden)
      .map((plugin) => ({
        key: plugin.key,
        name: plugin.name,
        displayName: plugin.displayName,
        description: plugin.description,
        packageName: plugin.packageName,
        version: plugin.version,
        enabled: PluginUtils.byKey(container.definition, plugin.key) != null,
        managedBy: plugin.managedBy,
      }));

    return { plugins };
  },
});
