import { produce, setAutoFreeze } from 'immer';

import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { pluginEntityType } from '#src/schema/plugins/entity-types.js';

import type { PluginImplementationStore } from '../schema/store.js';

import { pluginConfigSpec } from '../spec/config-spec.js';

export function runPluginMigrations(
  projectDefinition: ProjectDefinition,
  pluginImplementationStore: PluginImplementationStore,
): ProjectDefinition {
  const pluginConfigService =
    pluginImplementationStore.getPluginSpec(pluginConfigSpec);
  setAutoFreeze(false);
  return produce(projectDefinition, (draft) => {
    for (const pluginDefinition of draft.plugins ?? []) {
      const pluginMigrations = pluginConfigService.getMigrations(
        pluginEntityType.keyFromId(pluginDefinition.id),
      );
      const currentSchemaVersion = pluginDefinition.configSchemaVersion ?? -1;
      if (!pluginMigrations) continue;
      const lastPluginMigration = pluginMigrations.at(-1);
      if (!lastPluginMigration) continue;

      for (const migration of pluginMigrations) {
        if (migration.version > currentSchemaVersion) {
          try {
            pluginDefinition.config = migration.migrate(
              pluginDefinition.config,
            );
          } catch (error) {
            throw new Error(
              `Error migrating plugin ${pluginDefinition.id} to version ${migration.version}: ${String(error)}`,
            );
          }
        }
      }
      pluginDefinition.configSchemaVersion = lastPluginMigration.version;
    }
  });
}
