import type { ModelMergerModelInput } from '@baseplate-dev/project-builder-lib';

import type { Auth0PluginDefinition } from './plugin-definition.js';

export function createAuth0Models({
  authFeatureRef,
  modelRefs,
}: Pick<Auth0PluginDefinition, 'authFeatureRef' | 'modelRefs'>): {
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
    },
  };
}
