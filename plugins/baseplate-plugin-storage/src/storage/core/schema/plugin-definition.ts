import {
  authRoleEntityType,
  createEntityType,
  featureEntityType,
  modelEntityType,
  modelForeignRelationEntityType,
  VALIDATORS,
  zEnt,
  zRef,
  zRefBuilder,
} from '@halfdomelabs/project-builder-lib';
import z from 'zod';

export const storageAdapterEntityType = createEntityType(
  'baseplate-plugin-storage/storage-adapter',
);

export const storagePluginDefinitionSchema = zRefBuilder(
  z.object({
    fileModelRef: zRef(z.string(), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    featureRef: zRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    s3Adapters: z.array(
      zEnt(
        z.object({
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
        defaultAdapterRef: zRef(z.string(), {
          type: storageAdapterEntityType,
          onDelete: 'RESTRICT',
        }),
        maxFileSize: z.preprocess(
          (a) => a && Number.parseInt(a as string, 10),
          z.number().positive().optional(),
        ),
        usedByRelationRef: zRef(z.string(), {
          type: modelForeignRelationEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'fileModel' },
        }),
        uploadRoles: z.array(
          zRef(z.string().min(1), {
            type: authRoleEntityType,
            onDelete: 'DELETE',
          }),
        ),
      }),
    ),
  }),
  (builder) => {
    builder.addPathToContext('fileModelRef', modelEntityType, 'fileModel');
  },
);

export type StoragePluginDefinition = z.infer<
  typeof storagePluginDefinitionSchema
>;

export type StoragePluginDefinitionInput = z.input<
  typeof storagePluginDefinitionSchema
>;
