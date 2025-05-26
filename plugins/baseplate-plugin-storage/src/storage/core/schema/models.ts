import type {
  ModelMergerModelInput,
  ModelMergerScalarFieldInput,
  ProjectDefinitionContainer,
} from '@halfdomelabs/project-builder-lib';

import { authConfigSpec } from '@halfdomelabs/project-builder-lib';

const FILE_MODEL_FIELDS: ModelMergerScalarFieldInput[] = [
  {
    name: 'id',
    type: 'uuid',
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
  { storageFeatureRef }: { storageFeatureRef: string },
  projectDefinitionContainer: ProjectDefinitionContainer,
): { file: ModelMergerModelInput } {
  const authSpec =
    projectDefinitionContainer.pluginStore.getPluginSpec(authConfigSpec);
  const userAccountModel = authSpec.getUserModel(
    projectDefinitionContainer.definition,
  );
  if (!userAccountModel) {
    throw new Error(
      'User account model is required for storage plugin. Please enable an auth plugin.',
    );
  }
  return {
    file: {
      name: 'File',
      featureRef: storageFeatureRef,
      model: {
        fields: FILE_MODEL_FIELDS,
        primaryKeyFieldRefs: ['id'],
        relations: [
          {
            name: 'uploader',
            references: [{ localRef: 'uploaderId', foreignRef: 'id' }],
            modelRef: userAccountModel,
            foreignRelationName: 'files',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          },
        ],
      },
    },
  };
}
