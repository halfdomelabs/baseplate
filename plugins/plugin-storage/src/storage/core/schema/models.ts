import type {
  ModelMergerModelInput,
  ModelMergerScalarFieldInput,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import { authConfigSpec } from '@baseplate-dev/project-builder-lib';

const FILE_MODEL_FIELDS: ModelMergerScalarFieldInput[] = [
  {
    name: 'id',
    type: 'uuid',
    options: { genUuid: true },
  },
  // Core fields
  {
    name: 'filename',
    type: 'string',
  },
  {
    name: 'mimeType',
    type: 'string',
  },
  {
    name: 'encoding',
    type: 'string',
    isOptional: true,
  },
  {
    name: 'size',
    type: 'int',
  },
  // Storage info
  {
    name: 'category',
    type: 'string',
  },
  {
    name: 'adapter',
    type: 'string',
  },
  {
    name: 'storagePath',
    type: 'string',
  },
  // Status tracking via timestamps
  {
    name: 'referencedAt',
    type: 'dateTime',
    isOptional: true,
  },
  {
    name: 'expiredAt',
    type: 'dateTime',
    isOptional: true,
  },
  // Relations
  {
    name: 'uploaderId',
    type: 'uuid',
  },
  // Timestamps
  {
    name: 'createdAt',
    type: 'dateTime',
    options: { defaultToNow: true },
  },
  {
    name: 'updatedAt',
    type: 'dateTime',
    options: { defaultToNow: true, updatedAt: true },
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
      graphql: {
        objectType: {
          enabled: true,
          fields: ['id', 'filename'],
        },
      },
    },
  };
}
