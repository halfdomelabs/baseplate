import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { compareStrings } from '@baseplate-dev/utils';
import { z } from 'zod';

import { stripeWebhookConfigProvider } from '#src/stripe/core/generators/fastify-stripe/index.js';

import { STRIPE_BILLING_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  plans: z.array(
    z.object({
      key: z.string().min(1),
      displayName: z.string().min(1),
      grantedRoles: z.array(z.string()),
    }),
  ),
});

/**
 * Generator for billing module files (billing.service.ts, billing-config.ts).
 *
 * Placed inside a feature module via addChildrenToFeature, giving it access
 * to {module-root} for path resolution.
 */
export const billingModuleGenerator = createGenerator({
  name: 'stripe/billing-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ plans }) => ({
    paths: STRIPE_BILLING_MODULE_GENERATED.paths.task,
    imports: STRIPE_BILLING_MODULE_GENERATED.imports.task,
    renderers: STRIPE_BILLING_MODULE_GENERATED.renderers.task,
    webhookHandlers: createGeneratorTask({
      dependencies: {
        stripeWebhookConfig: stripeWebhookConfigProvider,
        paths: STRIPE_BILLING_MODULE_GENERATED.paths.provider,
      },
      run({ stripeWebhookConfig, paths }) {
        const handlerFragment = TsCodeUtils.importFragment(
          'handleSubscriptionEvent',
          paths.billingService,
        );
        stripeWebhookConfig.eventHandlers.set(
          'customer.subscription.created',
          handlerFragment,
        );
        stripeWebhookConfig.eventHandlers.set(
          'customer.subscription.updated',
          handlerFragment,
        );
        stripeWebhookConfig.eventHandlers.set(
          'customer.subscription.deleted',
          handlerFragment,
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: STRIPE_BILLING_MODULE_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        const plansObject: Record<string, string | TsCodeFragment> = {};
        for (const plan of plans) {
          const rolesArray =
            plan.grantedRoles.length > 0
              ? JSON.stringify(plan.grantedRoles.toSorted(compareStrings))
              : undefined;

          plansObject[plan.key] = TsCodeUtils.mergeFragmentsAsObject({
            grantedRoles: rolesArray,
            priceIds: JSON.stringify({
              stage: `price_PLACEHOLDER_STAGE_${plan.key.toUpperCase().replaceAll('-', '_')}`,
              prod: `price_PLACEHOLDER_PROD_${plan.key.toUpperCase().replaceAll('-', '_')}`,
            }),
          });
        }

        const plansFragment = TsCodeUtils.mergeFragmentsAsObject(plansObject);

        return {
          build: async (builder) => {
            await builder.apply(
              renderers.moduleGroup.render({
                variables: {
                  billingConfig: { TPL_PLANS: plansFragment },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
