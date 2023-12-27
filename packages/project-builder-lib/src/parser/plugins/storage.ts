import { ParserPlugin, PluginMergeModelFieldInput } from '../types.js';
import { FeatureUtils } from '@src/index.js';
import { notEmpty } from '@src/utils/array.js';

export const StoragePlugin: ParserPlugin = {
  name: 'StoragePlugin',
  run(projectConfig, hooks) {
    const { storage, auth, models } = projectConfig;
    if (!storage) {
      return;
    }
    if (!auth) {
      throw new Error(`Auth required for storage to be enabled`);
    }

    const transformerRelationNames = models.flatMap(
      (m) =>
        m.service?.transformers
          ?.map((t) => {
            if (t.type !== 'file') {
              return undefined;
            }
            // look up relation
            const relation = m.model.relations?.find((r) => r.name === t.name);
            // shouldn't happen as checked elsewhere
            if (!relation) throw new Error(`Relation not found for ${t.name}`);
            return relation.foreignRelationName;
          })
          .filter(notEmpty) ?? [],
    );

    const invalidTransformer = transformerRelationNames.find(
      (name) => !storage.categories.find((c) => c.usedByRelation === name),
    );

    if (invalidTransformer) {
      throw new Error(`No storage category found for ${invalidTransformer}`);
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
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
            isLocked: true,
          },
        ],
      },
    });

    const featurePath = FeatureUtils.getFeatureByIdOrThrow(
      projectConfig,
      storage.featurePath,
    ).name;

    // add feature providers
    hooks.addFeatureChildren(storage.featurePath, {
      $storage: {
        generator: '@halfdomelabs/fastify/storage/storage-module',
        fileObjectTypeRef: `${featurePath}/root:$schemaTypes.${storage.fileModel}ObjectType.$objectType`,
        fileModel: storage.fileModel,
        s3Adapters: storage.s3Adapters,
        categories: storage.categories,
      },
    });

    hooks.addGlobalHoistedProviders('storage-module');
  },
};
