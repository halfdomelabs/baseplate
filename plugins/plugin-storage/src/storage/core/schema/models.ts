import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { STORAGE_MODELS } from '#src/storage/constants/model-names.js';

export function createStoragePartialDefinition(
  storageFeatureName: string,
  userModelName: string,
): PartialProjectDefinitionInput {
  return {
    models: [
      {
        name: STORAGE_MODELS.file,
        featureRef: storageFeatureName,
        model: {
          fields: [
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
              isOptional: true,
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
            // Upload lifecycle
            {
              name: 'pendingUpload',
              type: 'boolean',
              options: { default: 'false' },
            },
            // Relations
            {
              name: 'uploaderId',
              type: 'uuid',
              isOptional: true,
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
          ],
          primaryKeyFieldRefs: ['id'],
          relations: [
            {
              name: 'uploader',
              references: [{ localRef: 'uploaderId', foreignRef: 'id' }],
              modelRef: userModelName,
              foreignRelationName: 'files',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
        graphql: {
          objectType: {
            enabled: true,
            fields: [{ ref: 'id' }, { ref: 'filename' }],
          },
        },
      },
    ],
  };
}
