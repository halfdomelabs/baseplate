import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  createEntityType,
  definitionSchema,
  featureEntityType,
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
    { type: billingPlanEntityType },
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
            const keys = plans.map((p) => p.key);
            const duplicates = keys.filter((v, i, a) => a.indexOf(v) !== i);
            if (duplicates.length > 0) {
              refinementCtx.addIssue({
                code: 'custom',
                message: `Duplicate plan key(s): ${duplicates.join(', ')}`,
              });
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
        if (billing.enabled && billing.plans.length === 0) {
          refinementCtx.addIssue({
            code: 'custom',
            message: 'At least one plan is required when billing is enabled.',
            path: ['plans'],
          });
        }
      })
      .prefault({ enabled: false, plans: [] }),
  });
});

export type StripePluginDefinition = def.InferOutput<
  typeof createStripePluginDefinitionSchema
>;
export type StripePluginDefinitionInput = def.InferInput<
  typeof createStripePluginDefinitionSchema
>;
