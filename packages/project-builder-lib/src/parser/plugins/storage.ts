import { ParserPlugin, PluginMergeModelFieldInput } from '../types';

export const StoragePlugin: ParserPlugin = {
  name: 'StoragePlugin',
  run(projectConfig, hooks) {
    const { storage, auth } = projectConfig;
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
        name: 'category',
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
      name: storage.fileModel,
      feature: storage.featurePath,
      model: {
        fields: fileFields,
        relations: [
          {
            name: 'uploader',
            references: [{ local: 'uploaderId', foreign: 'id' }],
            modelName: auth.userModel,
            foreignRelationName: 'files',
            relationshipType: 'oneToMany',
            isOptional: true,
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
            isLocked: true,
          },
        ],
      },
    });

    // add feature providers
    hooks.addFeatureChildren(storage.featurePath, {
      $storage: {
        generator: '@baseplate/fastify/storage/storage-module',
        fileModel: storage.fileModel,
        s3Adapters: storage.s3Adapters,
        categories: storage.categories,
      },
    });
  },
};
