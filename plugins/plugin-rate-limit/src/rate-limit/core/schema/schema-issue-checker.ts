import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  createPluginModelSyncChecker,
  FeatureUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { RateLimitPluginDefinition } from './plugin-definition.js';

import { createRateLimitPartialDefinition } from './models.js';

export function createRateLimitSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return createPluginModelSyncChecker({
    pluginKey,
    pluginLabel: 'Rate Limit',
    buildPartialDef: (container) => {
      const pluginConfig = PluginUtils.configByKey(
        container.definition,
        pluginKey,
      ) as RateLimitPluginDefinition | undefined;
      const featureRef = pluginConfig?.rateLimitFeatureRef;
      if (!featureRef) return undefined;

      try {
        const featureName = FeatureUtils.getFeaturePathByIdOrThrow(
          container.definition,
          featureRef,
        );
        return createRateLimitPartialDefinition(featureName);
      } catch {
        return undefined;
      }
    },
  });
}
