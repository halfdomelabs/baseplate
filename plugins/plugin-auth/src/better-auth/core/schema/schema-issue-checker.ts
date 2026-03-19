import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  createPluginModelSyncChecker,
  FeatureUtils,
} from '@baseplate-dev/project-builder-lib';

import { getAuthPluginDefinition } from '#src/auth/index.js';

import { createBetterAuthPartialDefinition } from './models.js';

export function createBetterAuthSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return createPluginModelSyncChecker({
    pluginKey,
    pluginLabel: 'Better Auth',
    buildPartialDef: (container) => {
      const authConfig = getAuthPluginDefinition(container.definition);
      try {
        const authFeatureName = FeatureUtils.getFeaturePathByIdOrThrow(
          container.definition,
          authConfig.authFeatureRef,
        );
        const accountsFeatureName = FeatureUtils.getFeaturePathByIdOrThrow(
          container.definition,
          authConfig.accountsFeatureRef,
        );
        return createBetterAuthPartialDefinition(
          authFeatureName,
          accountsFeatureName,
        );
      } catch {
        return undefined;
      }
    },
  });
}
