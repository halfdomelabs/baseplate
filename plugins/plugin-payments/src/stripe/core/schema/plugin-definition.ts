import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  createEntityType,
  definitionSchema,
  featureEntityType,
  withFix,
} from '@baseplate-dev/project-builder-lib';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { z } from 'zod';

export const billingPlanEntityType = createEntityType('stripe/billing-plan');

export const createBillingPlanSchema = definitionSchema((ctx) =>
  ctx.withEnt(
    z.object({
      id: z.string(),
      key: CASE_VALIDATORS.KEBAB_CASE.min(1),
      displayName: z.string().min(1),
      grantedRoles: z
        .array(
          ctx.withRef({
            type: authRoleEntityType,
            onDelete: 'RESTRICT',
          }),
        )
        .default([]),
    }),
    {
      type: billingPlanEntityType,
      getNameResolver: (data) => data.key,
    },
  ),
);

export type BillingPlanDefinition = def.InferOutput<
  typeof createBillingPlanSchema
>;

export type BillingPlanInput = def.InferInput<typeof createBillingPlanSchema>;

export const createStripePluginDefinitionSchema = definitionSchema((ctx) => {
  const billingPlanSchema = createBillingPlanSchema(ctx);

  return z.object({
    stripeOptions: z.object({}).prefault({}),
    billing: z
      .object({
        enabled: z.boolean().default(false),
        featureRef: ctx
          .withRef({
            type: featureEntityType,
            onDelete: 'RESTRICT',
          })
          .optional(),
        plans: z
          .array(billingPlanSchema)
          .default([])
          .superRefine((plans, refinementCtx) => {
            const seen = new Set<string>();
            for (const [i, plan] of plans.entries()) {
              const { key } = plan;
              if (seen.has(key)) {
                refinementCtx.addIssue({
                  code: 'custom',
                  message: `Duplicate plan key: ${key}`,
                  path: [i, 'key'],
                });
                break;
              }
              seen.add(key);
            }
          }),
      })
      .superRefine((billing, refinementCtx) => {
        if (billing.enabled && !billing.featureRef) {
          refinementCtx.addIssue({
            code: 'custom',
            message:
              'A billing feature must be selected when billing is enabled.',
            path: ['featureRef'],
          });
        }
      })
      .apply(
        withFix((value) => {
          if (!value.enabled) {
            return {
              enabled: false,
              featureRef: undefined,
              plans: [],
            };
          }
          return value;
        }),
      ),
  });
});

export type StripePluginDefinition = def.InferOutput<
  typeof createStripePluginDefinitionSchema
>;
export type StripePluginDefinitionInput = def.InferInput<
  typeof createStripePluginDefinitionSchema
>;
