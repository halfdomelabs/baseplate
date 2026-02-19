import type { ModelMergerModelInput } from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from '#src/auth/core/schema/plugin-definition.js';

import { AUTH0_MODELS } from '#src/auth0/constants/model-names.js';

export function createAuth0Models({
  authFeatureRef,
}: AuthPluginDefinition): Record<
  keyof typeof AUTH0_MODELS,
  ModelMergerModelInput
> {
  return {
    user: {
      name: AUTH0_MODELS.user,
      featureRef: authFeatureRef,
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
  };
}
