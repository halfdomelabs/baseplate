import { z } from 'zod';
import { randomUid } from '@src/utils/randomUid';
import { ReferencesBuilder } from '../references';

export const storageSchema = z.object({
  fileModel: z.string().min(1),
  featurePath: z.string().min(1),
  s3Adapters: z.array(
    z.object({
      uid: z.string().default(randomUid),
      name: z.string().min(1),
      bucketConfigVar: z.string().min(1),
    })
  ),
  categories: z.array(
    z.object({
      uid: z.string().default(randomUid),
      name: z.string().min(1),
      defaultAdapter: z.string().min(1),
      maxFileSize: z.preprocess(
        (a) => (a ? parseInt(a as string, 10) : undefined),
        z.number().positive().optional()
      ),
      usedByRelation: z.string().min(1),
      uploadRoles: z.array(z.string().min(1)),
    })
  ),
});

export type StorageConfig = z.infer<typeof storageSchema>;

export function buildStorageReferences(
  config: StorageConfig,
  builder: ReferencesBuilder<StorageConfig | undefined>
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
    categoryBuilder.addReference('usedByRelation', {
      category: 'modelForeignRelation',
      key: `${config.fileModel}#${category.usedByRelation}`,
    });
  });

  builder.addReference('featurePath', { category: 'feature' });
}
