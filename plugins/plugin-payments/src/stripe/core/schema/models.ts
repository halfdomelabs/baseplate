import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

/** Model name constants for billing entities. */
const BILLING_MODELS = {
  billingAccount: 'BillingAccount',
  billingSubscription: 'BillingSubscription',
} as const;

/** Enum name constants for billing. */
const BILLING_ENUMS = {
  billingSubscriptionStatus: 'BillingSubscriptionStatus',
} as const;

/**
 * Creates a partial project definition containing the billing models and enum.
 *
 * This is used by the definition editor UI to show a diff alert when the
 * billing feature ref is configured.
 *
 * @param featureName - The feature name to assign billing entities to.
 * @param userModelName - The name of the User model to add billingAccountId to.
 * @returns A partial project definition with billing models and enum.
 */
export function createBillingPartialDefinition(
  featureName: string,
  userModelName: string,
): PartialProjectDefinitionInput {
  return {
    enums: [
      {
        name: BILLING_ENUMS.billingSubscriptionStatus,
        featureRef: featureName,
        isExposed: true,
        values: [
          { name: 'ACTIVE', friendlyName: 'Active' },
          { name: 'TRIALING', friendlyName: 'Trialing' },
          { name: 'PAST_DUE', friendlyName: 'Past Due' },
          { name: 'CANCELED', friendlyName: 'Canceled' },
          { name: 'UNPAID', friendlyName: 'Unpaid' },
          { name: 'INCOMPLETE', friendlyName: 'Incomplete' },
          { name: 'INCOMPLETE_EXPIRED', friendlyName: 'Incomplete Expired' },
          { name: 'PAUSED', friendlyName: 'Paused' },
        ],
      },
    ],
    models: [
      {
        name: BILLING_MODELS.billingAccount,
        featureRef: featureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              name: 'stripeCustomerId',
              type: 'string',
            },
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
            {
              name: 'updatedAt',
              type: 'dateTime',
              options: { defaultToNow: true, updatedAt: true },
            },
          ],
          primaryKeyFieldRefs: ['id'],
          uniqueConstraints: [
            {
              fields: [{ fieldRef: 'stripeCustomerId' }],
            },
          ],
        },
      },
      {
        name: BILLING_MODELS.billingSubscription,
        featureRef: featureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              name: 'billingAccountId',
              type: 'uuid',
            },
            {
              name: 'planKey',
              type: 'string',
            },
            {
              name: 'status',
              type: 'enum',
              options: {
                enumRef: BILLING_ENUMS.billingSubscriptionStatus,
              },
            },
            {
              name: 'stripeSubscriptionId',
              type: 'string',
            },
            {
              name: 'currentPeriodStart',
              type: 'dateTime',
            },
            {
              name: 'currentPeriodEnd',
              type: 'dateTime',
            },
            {
              name: 'cancelAtPeriodEnd',
              type: 'boolean',
              options: { default: 'false' },
            },
            {
              name: 'createdAt',
              type: 'dateTime',
              options: { defaultToNow: true },
            },
            {
              name: 'updatedAt',
              type: 'dateTime',
              options: { defaultToNow: true, updatedAt: true },
            },
          ],
          primaryKeyFieldRefs: ['id'],
          uniqueConstraints: [
            {
              fields: [{ fieldRef: 'stripeSubscriptionId' }],
            },
          ],
          relations: [
            {
              name: 'billingAccount',
              references: [{ localRef: 'billingAccountId', foreignRef: 'id' }],
              modelRef: BILLING_MODELS.billingAccount,
              foreignRelationName: 'billingSubscriptions',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
      {
        name: userModelName,
        model: {
          fields: [
            {
              name: 'billingAccountId',
              type: 'uuid',
              isOptional: true,
            },
          ],
          uniqueConstraints: [
            {
              fields: [{ fieldRef: 'billingAccountId' }],
            },
          ],
          relations: [
            {
              name: 'billingAccount',
              references: [{ localRef: 'billingAccountId', foreignRef: 'id' }],
              modelRef: BILLING_MODELS.billingAccount,
              foreignRelationName: 'user',
              onDelete: 'SetNull',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
    ],
  };
}
