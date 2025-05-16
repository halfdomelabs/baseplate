import type { ModelMergerModelInput } from '@halfdomelabs/project-builder-lib';

export function createAuth0Models(): {
  user: ModelMergerModelInput;
} {
  return {
    user: {
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
