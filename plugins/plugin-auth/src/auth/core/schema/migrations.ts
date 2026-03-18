import type { PluginConfigMigration } from '@baseplate-dev/project-builder-lib';

import { featureEntityType } from '@baseplate-dev/project-builder-lib';

export const AUTH_PLUGIN_CONFIG_MIGRATIONS: PluginConfigMigration[] = [
  {
    name: 'add-accounts-feature-ref',
    version: 1,
    // Plugin migrations run on raw serialized JSON where withRef fields store
    // feature NAME PATHS (e.g. "accounts/auth"), not IDs. Values must be set to
    // names so deserialization can resolve them to feature IDs.
    migrate: (config, projectDefinition) => {
      const typedConfig = config as {
        authFeatureRef?: string;
        accountsFeatureRef?: string;
        [key: string]: unknown;
      };

      const def = projectDefinition as {
        features?: { id: string; name: string; parentRef?: string }[];
      };

      const features = def.features ?? [];

      // Find or plan to create the three features needed for the new hierarchy:
      //   accounts        (parent, no code)
      //   accounts/auth   (auth infrastructure)
      //   accounts/users  (user models)
      const accountsFeature = features.find(
        (f) => f.name === 'accounts' && !f.parentRef,
      );

      const accountsId =
        accountsFeature?.id ?? featureEntityType.generateNewId();

      const accountsAuthFeature = features.find(
        (f) => f.name === 'accounts/auth',
      );
      const accountsAuthId =
        accountsAuthFeature?.id ?? featureEntityType.generateNewId();

      const accountsUsersFeature = features.find(
        (f) => f.name === 'accounts/users',
      );
      const accountsUsersId =
        accountsUsersFeature?.id ?? featureEntityType.generateNewId();

      return {
        updatedConfig: {
          ...typedConfig,
          authFeatureRef: 'accounts/auth',
          accountsFeatureRef: 'accounts/users',
        },
        updateProjectDefinition: (draft: unknown) => {
          const draftDef = draft as {
            features?: { id: string; name: string; parentRef?: string }[];
          };
          draftDef.features ??= [];

          if (!accountsFeature) {
            draftDef.features.push({ id: accountsId, name: 'accounts' });
          }
          if (!accountsAuthFeature) {
            draftDef.features.push({
              id: accountsAuthId,
              name: 'accounts/auth',
              parentRef: 'accounts',
            });
          }
          if (!accountsUsersFeature) {
            draftDef.features.push({
              id: accountsUsersId,
              name: 'accounts/users',
              parentRef: 'accounts',
            });
          }
        },
      };
    },
  },
];
