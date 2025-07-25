import type { def } from '@baseplate-dev/project-builder-lib';

import {
  createEntityType,
  definitionSchema,
  featureEntityType,
  modelEntityType,
  VALIDATORS,
} from '@baseplate-dev/project-builder-lib';
import z from 'zod';

export const storageAdapterEntityType = createEntityType(
  'plugin-storage/storage-adapter',
);

export const createStoragePluginDefinitionSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(
    z.object({
      modelRefs: z.object({
        file: ctx.withRef({
          type: modelEntityType,
          onDelete: 'RESTRICT',
        }),
      }),
      storageFeatureRef: ctx.withRef({
        type: featureEntityType,
        onDelete: 'RESTRICT',
      }),
      s3Adapters: z.array(
        ctx.withEnt(
          z.object({
            id: z.string(),
            name: VALIDATORS.CAMEL_CASE_STRING,
            bucketConfigVar: VALIDATORS.CONSTANT_CASE_STRING,
            hostedUrlConfigVar: VALIDATORS.OPTIONAL_CONSTANT_CASE_STRING,
          }),
          { type: storageAdapterEntityType },
        ),
      ),
    }),
    (builder) => {
      builder.addPathToContext('modelRefs.file', modelEntityType, 'fileModel');
    },
  ),
);

export type StoragePluginDefinition = def.InferOutput<
  typeof createStoragePluginDefinitionSchema
>;

export type StoragePluginDefinitionInput = def.InferInput<
  typeof createStoragePluginDefinitionSchema
>;
