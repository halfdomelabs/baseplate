import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { AUTH0_MODELS } from '#src/auth0/constants/model-names.js';

export function createAuth0PartialDefinition(
  authFeatureName: string,
): PartialProjectDefinitionInput {
  return {
    models: [
      {
        name: AUTH0_MODELS.user,
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
            },
            {
              name: 'auth0Id',
              type: 'string',
              isOptional: true,
            },
          ],
          primaryKeyFieldRefs: ['id'],
          uniqueConstraints: [
            {
              fields: [{ fieldRef: 'auth0Id' }],
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
