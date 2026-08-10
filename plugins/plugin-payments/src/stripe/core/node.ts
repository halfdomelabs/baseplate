import type { AgentDocDefinition } from '@baseplate-dev/plugin-ai';

import { agentDocCompiler, agentDocsSpec } from '@baseplate-dev/plugin-ai';
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

const STRIPE_BILLING_DOC = `# Stripe Billing Plans

This project uses the \`stripe\` plugin to process payments and handle webhooks. Billing is enabled, so subscriptions are managed through **billing plans**.

## Configuring billing plans

Use the Baseplate MCP \`configure-plugin\` tool with \`pluginKey: 'stripe'\` to add or edit entries under \`billing.plans\`. Each plan has:

- **key** — kebab-case identifier for the plan, referenced by the Stripe price/product configuration in application code
- **displayName** — human-readable name shown to users
- **grantedRoles** — authorization roles granted to an account while it holds an active subscription to this plan

\`billing.featureRef\` controls which feature the generated billing module is placed under.

## How it works

- Subscribing/canceling in Stripe updates the account's granted roles via webhook handling generated into the billing module
- Role grants are idempotent and kept in sync with the subscription's current status

Run \`sync-project\` after committing changes to regenerate the billing module.
`;

export default createPluginModule({
  name: 'node',
  dependencies: {
    appCompiler: appCompilerSpec,
    agentDocs: agentDocsSpec,
  },
  initialize: ({ appCompiler, agentDocs }, { pluginKey }) => {
    agentDocs.compilers.push(
      agentDocCompiler({
        pluginKey,
        compile: ({ projectDefinition }) => {
          const config = PluginUtils.configByKeyOrThrow(
            projectDefinition,
            pluginKey,
          ) as StripePluginDefinition;

          const docs: Record<string, AgentDocDefinition> = {};

          if (config.billing.enabled) {
            docs['stripe-billing-plans'] = {
              id: 'stripe-billing-plans',
              description:
                'how to configure Stripe billing plans and the roles they grant subscribers',
              content: STRIPE_BILLING_DOC,
            };
          }

          return docs;
        },
      }),
    );

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
