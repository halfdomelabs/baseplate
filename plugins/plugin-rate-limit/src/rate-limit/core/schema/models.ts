import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { FeatureUtils } from '@baseplate-dev/project-builder-lib';

import { RATE_LIMIT_MODELS } from '#src/rate-limit/constants/model-names.js';

export function createRateLimitPartialDefinition(
  featureName: string,
): PartialProjectDefinitionInput {
  return {
    features: FeatureUtils.createPartialFeatures(featureName),
    models: [
      {
        name: RATE_LIMIT_MODELS.rateLimiterFlexible,
        featureRef: featureName,
        model: {
          fields: [
            {
              name: 'key',
              type: 'string',
            },
            {
              name: 'points',
              type: 'int',
            },
            {
              name: 'expire',
              type: 'dateTime',
              isOptional: true,
            },
          ],
          primaryKeyFieldRefs: ['key'],
        },
      },
    ],
  };
}
