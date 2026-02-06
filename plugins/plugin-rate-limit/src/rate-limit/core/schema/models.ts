import type { ModelMergerModelInput } from '@baseplate-dev/project-builder-lib';

import { RATE_LIMIT_MODELS } from '#src/rate-limit/constants/model-names.js';

export function createRateLimitModels(
  featureRef: string,
): Record<keyof typeof RATE_LIMIT_MODELS, ModelMergerModelInput> {
  return {
    rateLimiterFlexible: {
      name: RATE_LIMIT_MODELS.rateLimiterFlexible,
      featureRef,
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
  };
}
