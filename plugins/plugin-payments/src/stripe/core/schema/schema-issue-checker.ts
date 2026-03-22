import type { DefinitionIssueChecker } from '@baseplate-dev/project-builder-lib';

import {
  authModelsSpec,
  createPluginModelSyncChecker,
  FeatureUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { StripePluginDefinition } from './plugin-definition.js';

import { createBillingPartialDefinition } from './models.js';

export function createStripeSchemaChecker(
  pluginKey: string,
): DefinitionIssueChecker {
  return createPluginModelSyncChecker({
    pluginKey,
    pluginLabel: 'Stripe',
    buildPartialDef: (container) => {
      const stripeConfig = PluginUtils.configByKey(
        container.definition,
        pluginKey,
      ) as StripePluginDefinition | undefined;

      if (!stripeConfig?.billing.enabled || !stripeConfig.billing.featureRef) {
        return undefined;
      }

      try {
        const authModels = container.pluginStore.use(authModelsSpec);
        const userModelName = authModels.getAuthModelsOrThrow(
          container.definition,
        ).user;

        const featureName = FeatureUtils.getFeaturePathByIdOrThrow(
          container.definition,
          stripeConfig.billing.featureRef,
        );

        return createBillingPartialDefinition(featureName, userModelName);
      } catch {
        return undefined;
      }
    },
  });
}
