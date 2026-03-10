import type { def } from '@baseplate-dev/project-builder-lib';

import {
  authRoleEntityType,
  createEntityType,
  definitionSchema,
  featureEntityType,
  VALIDATORS,
} from '@baseplate-dev/project-builder-lib';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import z from 'zod';

export const storageAdapterEntityType = createEntityType(
  'plugin-storage/storage-adapter',
);

export const fileCategoryEntityType = createEntityType(
  'plugin-storage/file-category',
);

export const createStoragePluginDefinitionSchema = definitionSchema((ctx) =>
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
    fileCategories: z
      .array(
        ctx.withEnt(
          z.object({
            id: z.string(),
            name: CASE_VALIDATORS.CONSTANT_CASE,
            maxFileSizeMb: z.int().positive(),
            authorize: z.object({
              uploadRoles: z.array(
                ctx.withRef({
                  type: authRoleEntityType,
                  onDelete: 'RESTRICT',
                }),
              ),
            }),
            adapterRef: ctx.withRef({
              type: storageAdapterEntityType,
              onDelete: 'RESTRICT',
            }),
            disableAutoCleanup: z.boolean().optional(),
          }),
          { type: fileCategoryEntityType },
        ),
      )
      .default([]),
  }),
);

export type StoragePluginDefinition = def.InferOutput<
  typeof createStoragePluginDefinitionSchema
>;

export type StoragePluginDefinitionInput = def.InferInput<
  typeof createStoragePluginDefinitionSchema
>;
