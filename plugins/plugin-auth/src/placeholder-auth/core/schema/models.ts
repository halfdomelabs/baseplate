import type { ModelMergerModelInput } from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from '#src/auth/core/schema/plugin-definition.js';

import { PLACEHOLDER_AUTH_MODELS } from '#src/placeholder-auth/constants/model-names.js';

export function createAuthModels({
  authFeatureRef,
}: AuthPluginDefinition): Record<
  keyof typeof PLACEHOLDER_AUTH_MODELS,
  ModelMergerModelInput
> {
  return {
    user: {
      name: PLACEHOLDER_AUTH_MODELS.user,
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
  };
}
