import { produce } from 'immer';

import type { ProjectDefinition } from '#src/schema/project-definition.js';

import { pluginEntityType } from '#src/schema/plugins/entity-types.js';

import type { PluginSpecStore } from '../store/store.js';

import { pluginConfigSpec } from '../spec/config-spec.js';

export function runPluginMigrations(
  projectDefinition: ProjectDefinition,
  pluginImplementationStore: PluginSpecStore,
): ProjectDefinition {
  const pluginConfigService = pluginImplementationStore.use(pluginConfigSpec);
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
            const migrationResult = migration.migrate(
              pluginDefinition.config,
              draft,
            );

            if (migrationResult.updatedConfig !== undefined) {
              pluginDefinition.config = migrationResult.updatedConfig;
            }

            if (migrationResult.updateProjectDefinition) {
              migrationResult.updateProjectDefinition(draft);
            }
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
