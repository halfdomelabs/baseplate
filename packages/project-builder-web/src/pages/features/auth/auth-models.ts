import type {
  ModelDefinitionInput,
  ModelScalarFieldDefinitionInput,
} from '@halfdomelabs/project-builder-lib';

const AUTH0_MODEL_FIELDS: ModelScalarFieldDefinitionInput[] = [
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
];

const AUTH0_USER_ROLE_FIELDS: ModelScalarFieldDefinitionInput[] = [
  {
    name: 'userId',
    type: 'uuid',
  },
  {
    name: 'role',
    type: 'string',
  },
];

export function createAuth0Models(userModelRef: string): {
  user: ModelDefinitionInput;
  userRole: ModelDefinitionInput;
} {
  return {
    user: {
      fields: AUTH0_MODEL_FIELDS,
      primaryKeyFieldRefs: ['id'],
      uniqueConstraints: [
        {
          fields: [{ fieldRef: 'auth0Id' }],
        },
      ],
    },
    userRole: {
      fields: AUTH0_USER_ROLE_FIELDS,
      primaryKeyFieldRefs: ['userId', 'role'],
      relations: [
        {
          name: 'user',
          references: [{ localRef: 'userId', foreignRef: 'id' }],
          modelRef: userModelRef,
          foreignRelationName: 'roles',
          onDelete: 'Cascade',
          onUpdate: 'Restrict',
        },
      ],
    },
  };
}
