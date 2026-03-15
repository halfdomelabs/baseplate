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
        compile: ({ projectDefinition, appCompiler }) => {
          const config = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as StripePluginDefinition;

          appCompiler.addRootChildren({
            stripe: fastifyStripeGenerator({}),
          });

          if (config.billingFeatureRef) {
            appCompiler.addRootChildren({
              billingWebhook: billingWebhookGenerator({}),
            });
            appCompiler.addChildrenToFeature(config.billingFeatureRef, {
              billingModule: billingModuleGenerator({}),
            });
          }
        },
      }),
    );
  },
});
