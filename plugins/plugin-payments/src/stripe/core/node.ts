import {
  appCompilerSpec,
  backendAppEntryType,
  createPluginModule,
  pluginAppCompiler,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import type { StripePluginDefinition } from './schema/plugin-definition.js';

import { fastifyStripeGenerator } from './generators/fastify-stripe/index.js';
import { billingModuleGenerator } from './generators/stripe/billing-module/index.js';
import { billingWebhookGenerator } from './generators/stripe/billing-webhook/index.js';

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.compilers.push(
      pluginAppCompiler({
        pluginKey,
        appType: backendAppEntryType,
        compile: ({ projectDefinition, definitionContainer, appCompiler }) => {
          const config = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as StripePluginDefinition;

          appCompiler.addRootChildren({
            stripe: fastifyStripeGenerator({}),
          });

          const { billing } = config;
          if (billing.enabled && billing.featureRef) {
            appCompiler.addRootChildren({
              billingWebhook: billingWebhookGenerator({}),
            });
            appCompiler.addChildrenToFeature(billing.featureRef, {
              billingModule: billingModuleGenerator({
                plans: billing.plans.map((p) => ({
                  key: p.key,
                  displayName: p.displayName,
                  grantedRoles: p.grantedRoles.map((r) =>
                    definitionContainer.nameFromId(r),
                  ),
                })),
              }),
            });
          }
        },
      }),
    );
  },
});
