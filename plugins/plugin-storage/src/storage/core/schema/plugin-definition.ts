import type { def } from '@baseplate-dev/project-builder-lib';

import {
  createEntityType,
  definitionSchema,
  featureEntityType,
  VALIDATORS,
} from '@baseplate-dev/project-builder-lib';
import z from 'zod';

export const storageAdapterEntityType = createEntityType(
  'plugin-storage/storage-adapter',
);

export const createStoragePluginDefinitionSchema = definitionSchema((ctx) =>
  ctx.withRefBuilder(
    z.object({
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
    (_) => {
      // No model refs to add to context
    },
  ),
);

export type StoragePluginDefinition = def.InferOutput<
  typeof createStoragePluginDefinitionSchema
>;

export type StoragePluginDefinitionInput = def.InferInput<
  typeof createStoragePluginDefinitionSchema
>;
