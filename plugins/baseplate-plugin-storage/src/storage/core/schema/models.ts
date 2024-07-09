import {
  ModelDefinitionInput,
  ModelScalarFieldDefinitionInput,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';

export const FILE_MODEL_FIELDS: ModelScalarFieldDefinitionInput[] = [
  {
    name: 'id',
    type: 'uuid',
    isId: true,
    options: { genUuid: true },
  },
  {
    name: 'category',
    type: 'string',
  },
  {
    name: 'adapter',
    type: 'string',
  },
  {
    name: 'path',
    type: 'string',
  },
  {
    name: 'mimeType',
    type: 'string',
  },
  {
    name: 'size',
    type: 'int',
  },
  {
    name: 'name',
    type: 'string',
  },
  {
    name: 'shouldDelete',
    type: 'boolean',
  },
  {
    name: 'isUsed',
    type: 'boolean',
  },
  {
    name: 'uploaderId',
    type: 'uuid',
    isOptional: true,
  },
  {
    name: 'updatedAt',
    type: 'dateTime',
    options: { defaultToNow: true, updatedAt: true },
  },
  {
    name: 'createdAt',
    type: 'dateTime',
    options: { defaultToNow: true },
  },
];

export function createStorageModels(
  projectDefinitionContainer: ProjectDefinitionContainer,
): { file: ModelDefinitionInput } {
  const auth = projectDefinitionContainer.definition.auth;
  if (!auth) {
    throw new Error('Auth plugin is required for storage plugin');
  }
  return {
    file: {
      fields: FILE_MODEL_FIELDS,
      relations: [
        {
          name: 'uploader',
          references: [{ local: 'uploaderId', foreign: 'id' }],
          modelName: auth.userModel,
          foreignRelationName: 'files',
          onDelete: 'Cascade',
          onUpdate: 'Restrict',
        },
      ],
    },
  };
}
