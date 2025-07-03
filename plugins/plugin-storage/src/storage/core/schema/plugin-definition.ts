import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  createEntityType,
  definitionSchema,
  featureEntityType,
  modelEntityType,
  modelForeignRelationEntityType,
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
        file: ctx.withRef(z.string(), {
          type: modelEntityType,
          onDelete: 'RESTRICT',
        }),
      }),
      storageFeatureRef: ctx.withRef(z.string().min(1), {
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
      categories: z.array(
        z.object({
          name: z.string().min(1),
          defaultAdapterRef: ctx.withRef(z.string(), {
            type: storageAdapterEntityType,
            onDelete: 'RESTRICT',
          }),
          maxFileSize: z.preprocess(
            (a) => a && Number.parseInt(a as string, 10),
            z.number().positive().optional(),
          ),
          usedByRelationRef: ctx.withRef(z.string(), {
            type: modelForeignRelationEntityType,
            onDelete: 'RESTRICT',
            parentPath: { context: 'fileModel' },
          }),
          uploadRoles: z.array(
            ctx.withRef(z.string().min(1), {
              type: authRoleEntityType,
              onDelete: 'DELETE',
            }),
          ),
        }),
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
