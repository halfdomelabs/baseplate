import { z } from 'zod';

import { featureEntityType } from '../features/index.js';
import {
  modelEntityType,
  modelForeignRelationEntityType,
} from '../models/index.js';
import { ReferencesBuilder } from '../references.js';
import { zRef, zRefBuilder } from '@src/references/index.js';
import { randomUid } from '@src/utils/randomUid.js';

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
      z.object({
        uid: z.string().default(randomUid),
        name: z.string().min(1),
        bucketConfigVar: z.string().min(1),
        hostedUrlConfigVar: z.string().optional(),
      }),
    ),
    categories: z.array(
      z.object({
        uid: z.string().default(randomUid),
        name: z.string().min(1),
        defaultAdapter: z.string().min(1),
        maxFileSize: z.preprocess(
          (a) => a && parseInt(a as string, 10),
          z.number().positive().optional(),
        ),
        usedByRelation: zRef(z.string(), {
          type: modelForeignRelationEntityType,
          onDelete: 'RESTRICT',
          parentPath: { context: 'fileModel' },
        }),
        uploadRoles: z.array(z.string().min(1)),
      }),
    ),
  }),
  (builder) => {
    builder.addPathToContext('fileModel', modelEntityType, 'fileModel');
  },
);

export type StorageConfig = z.infer<typeof storageSchema>;

export function buildStorageReferences(
  config: StorageConfig,
  builder: ReferencesBuilder<StorageConfig>,
): void {
  config.s3Adapters?.forEach((adapter) => {
    builder.addReferenceable({
      category: 'storageAdapter',
      id: adapter.uid,
      name: adapter.name,
    });
  });

  config.categories?.forEach((category, idx) => {
    builder.addReferenceable({
      category: 'storageCategory',
      id: category.uid,
      name: category.name,
    });

    const categoryBuilder = builder.withPrefix(`categories.${idx}`);

    categoryBuilder.addReference('defaultAdapter', {
      category: 'storageAdapter',
    });
  });
}
