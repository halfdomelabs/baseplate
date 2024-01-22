import { z } from 'zod';

import { featureEntityType } from '../features/index.js';
import { authRoleEntityType } from '../index.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
} from '../models/index.js';
import {
  createEntityType,
  zEnt,
  zRef,
  zRefBuilder,
} from '@src/references/index.js';

export const storageAdapterEntityType = createEntityType('storage-adapter');

export const storageSchema = zRefBuilder(
  z.object({
    fileModel: zRef(z.string(), {
      type: modelEntityType,
      onDelete: 'RESTRICT',
    }),
    featurePath: zRef(z.string().min(1), {
      type: featureEntityType,
      onDelete: 'RESTRICT',
    }),
    s3Adapters: z.array(
      zEnt(
        z.object({
          name: z.string().min(1),
          bucketConfigVar: z.string().min(1),
          hostedUrlConfigVar: z.string().optional(),
        }),
        { type: storageAdapterEntityType },
      ),
    ),
    categories: z.array(
      z.object({
        name: z.string().min(1),
        defaultAdapter: zRef(z.string(), {
          type: storageAdapterEntityType,
          onDelete: 'RESTRICT',
        }),
        maxFileSize: z.preprocess(
          (a) => a && parseInt(a as string, 10),
          z.number().positive().optional(),
        ),
        usedByRelation: zRef(z.string(), {
          type: modelForeignRelationEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'fileModel' },
        }),
        uploadRoles: z.array(
          zRef(z.string().min(1), {
            type: authRoleEntityType,
            onDelete: 'RESTRICT',
          }),
        ),
      }),
    ),
  }),
  (builder) => {
    builder.addPathToContext('fileModel', modelEntityType, 'fileModel');
  },
);

export type StorageConfig = z.infer<typeof storageSchema>;
