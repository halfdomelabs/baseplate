import { ParserPlugin, PluginMergeModelFieldInput } from '../types.js';
import { FeatureUtils, ModelUtils } from '@src/definition/index.js';

export const StoragePlugin: ParserPlugin = {
  name: 'StoragePlugin',
  run(projectDefinition, hooks, definitionContainer) {
    const { storage, auth } = projectDefinition;
    if (!storage) {
      return;
    }
    if (!auth) {
      throw new Error(`Auth required for storage to be enabled`);
    }

    // const transformerRelationNames = models.flatMap(
    //   (m) =>
    //     m.service?.transformers
    //       ?.map((t) => {
    //         if (t.type !== 'file') {
    //           return undefined;
    //         }
    //         // look up relation
    //         const relation = m.model.relations?.find(
    //           (r) => r.id === t.fileRelationRef,
    //         );
    //         // shouldn't happen as checked elsewhere
    //         if (!relation)
    //           throw new Error(`Relation not found for ${t.fileRelationRef}`);
    //         return relation.foreignId;
    //       })
    //       .filter(notEmpty) ?? [],
    // );

    // const invalidTransformer = transformerRelationNames.find(
    //   (name) => !storage.categories.find((c) => c.usedByRelation === name),
    // );

    // if (invalidTransformer) {
    //   throw new Error(`No storage category found for ${invalidTransformer}`);
    // }

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

    const featurePath = FeatureUtils.getFeatureByIdOrThrow(
      projectDefinition,
      storage.featurePath,
    ).name;

    // add feature providers
    const fileModelName = definitionContainer.nameFromId(storage.fileModel);
    hooks.addFeatureChildren(storage.featurePath, {
      $storage: {
        generator: '@halfdomelabs/fastify/storage/storage-module',
        fileObjectTypeRef: `${featurePath}/root:$schemaTypes.${fileModelName}ObjectType.$objectType`,
        fileModel: fileModelName,
        s3Adapters: storage.s3Adapters.map((a) => ({
          name: a.name,
          bucketConfigVar: a.bucketConfigVar,
          hostedUrlConfigVar: a.hostedUrlConfigVar,
        })),
        categories: storage.categories.map((c) => ({
          ...c,
          usedByRelation: definitionContainer.nameFromId(c.usedByRelation),
          defaultAdapter: definitionContainer.nameFromId(c.defaultAdapter),
          uploadRoles: c.uploadRoles.map((r) =>
            definitionContainer.nameFromId(r),
          ),
        })),
      },
    });

    hooks.addGlobalHoistedProviders('storage-module');
  },
};
