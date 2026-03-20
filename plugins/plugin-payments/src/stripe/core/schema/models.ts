import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';

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
    features: FeatureUtils.createPartialFeatures(featureName),
    enums: [
      {
        name: BILLING_ENUMS.billingSubscriptionStatus,
        featureRef: featureName,
        isExposed: true,
        values: [
          {
            name: 'ACTIVE',
            friendlyName: 'Active',
            description: 'Subscription is active and billing normally',
          },
          {
            name: 'TRIALING',
            friendlyName: 'Trialing',
            description: 'Subscription is in a free trial period',
          },
          {
            name: 'PAST_DUE',
            friendlyName: 'Past Due',
            description:
              'Payment failed but the subscription has not been canceled yet',
          },
          {
            name: 'CANCELED',
            friendlyName: 'Canceled',
            description: 'Subscription has been canceled',
          },
          {
            name: 'UNPAID',
            friendlyName: 'Unpaid',
            description:
              'Payment retries have been exhausted and the subscription remains unpaid',
          },
          {
            name: 'INCOMPLETE',
            friendlyName: 'Incomplete',
            description:
              'Initial payment attempt failed when creating the subscription',
          },
          {
            name: 'INCOMPLETE_EXPIRED',
            friendlyName: 'Incomplete Expired',
            description:
              'First invoice was not paid within the allowed time period',
          },
          {
            name: 'PAUSED',
            friendlyName: 'Paused',
            description: 'Subscription has been temporarily paused',
          },
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
