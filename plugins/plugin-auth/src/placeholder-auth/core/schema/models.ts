import type { ModelMergerModelInput } from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from '#src/auth/core/schema/plugin-definition.js';

import type { PlaceholderAuthPluginDefinition } from './plugin-definition.js';

export function createAuthModels(
  { modelRefs }: Pick<PlaceholderAuthPluginDefinition, 'modelRefs'>,
  { authFeatureRef }: AuthPluginDefinition,
): {
  user: ModelMergerModelInput;
} {
  return {
    user: {
      name: modelRefs.user,
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
          fields: ['id', 'email'],
        },
      },
    },
  };
}
