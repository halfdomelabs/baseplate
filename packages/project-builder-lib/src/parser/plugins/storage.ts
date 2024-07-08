import { ParserPlugin, PluginMergeModelFieldInput } from '../types.js';
import { ModelUtils } from '@src/definition/index.js';

export const StoragePlugin: ParserPlugin = {
  name: 'StoragePlugin',
  run(projectDefinition, hooks) {
    const { storage, auth } = projectDefinition;
    if (!storage) {
      return;
    }
    if (!auth) {
      throw new Error(`Auth required for storage to be enabled`);
    }

    // annotate file model
    const fileFields: PluginMergeModelFieldInput[] = [
      {
        name: 'id',
        isLocked: true,
        type: 'uuid',
        isId: true,
        options: { genUuid: true },
      },
      {
        name: 'category',
        isLocked: true,
        type: 'string',
      },
      {
        name: 'adapter',
        isLocked: true,
        type: 'string',
      },
      {
        name: 'path',
        isLocked: true,
        type: 'string',
      },
      {
        name: 'mimeType',
        isLocked: true,
        type: 'string',
      },
      {
        name: 'size',
        isLocked: true,
        type: 'int',
      },
      {
        name: 'name',
        isLocked: true,
        type: 'string',
      },
      {
        name: 'shouldDelete',
        isLocked: true,
        type: 'boolean',
      },
      {
        name: 'isUsed',
        isLocked: true,
        type: 'boolean',
      },
      {
        name: 'uploaderId',
        isLocked: true,
        type: 'uuid',
        isOptional: true,
      },
      {
        name: 'updatedAt',
        isLocked: true,
        type: 'dateTime',
        options: { defaultToNow: true, updatedAt: true },
      },
      {
        name: 'createdAt',
        isLocked: true,
        type: 'dateTime',
        options: { defaultToNow: true },
      },
    ];

    hooks.mergeModel({
      name: ModelUtils.byId(projectDefinition, storage.fileModel).name,
      feature: storage.featurePath,
      model: {
        fields: fileFields,
        relations: [
          {
            name: 'uploader',
            references: [{ local: 'uploaderId', foreign: 'id' }],
            modelName: auth.userModel,
            foreignRelationName: 'files',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
            isLocked: true,
          },
        ],
      },
    });
  },
};
