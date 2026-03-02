import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { PLACEHOLDER_AUTH_MODELS } from '#src/placeholder-auth/constants/model-names.js';

export function createPlaceholderAuthPartialDefinition(
  authFeatureName: string,
): PartialProjectDefinitionInput {
  return {
    models: [
      {
        name: PLACEHOLDER_AUTH_MODELS.user,
        featureRef: authFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              name: 'email',
              type: 'string',
              isOptional: true,
            },
          ],
          primaryKeyFieldRefs: ['id'],
          uniqueConstraints: [
            {
              fields: [{ fieldRef: 'email' }],
            },
          ],
        },
        graphql: {
          objectType: {
            enabled: true,
            fields: [{ ref: 'id' }, { ref: 'email' }],
          },
        },
      },
    ],
  };
}
