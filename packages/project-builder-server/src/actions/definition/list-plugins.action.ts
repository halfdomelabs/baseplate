import { PluginUtils } from '@baseplate-dev/project-builder-lib';

import { createServiceAction } from '#src/actions/types.js';

import { listPluginsMetadata } from './list-plugins.action-metadata.js';
import { loadEntityServiceContext } from './load-entity-service-context.js';

export const listPluginsAction = createServiceAction({
  ...listPluginsMetadata,
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
    for (const error of output.discoveryErrors ?? []) {
      console.warn(
        `  ! Plugin discovery failed for ${error.directory}: ${error.reason}`,
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

    return {
      plugins,
      discoveryErrors: context.pluginDiscoveryErrors?.length
        ? context.pluginDiscoveryErrors
        : undefined,
    };
  },
});
