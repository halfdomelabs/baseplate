import * as yup from 'yup';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { ReferencesBuilder } from '../references';

export const storageSchema = yup.object({
  fileModel: yup.string().required(),
  featurePath: yup.string().required(),
  s3Adapters: yup.array().of(
    yup.object({
      uid: yup.string().default(randomUid),
      name: yup.string().required(),
      bucketConfigVar: yup.string().required(),
    })
  ),
  categories: yup.array().of(
    yup.object({
      uid: yup.string().default(randomUid),
      name: yup.string().required(),
      defaultAdapter: yup.string().required(),
      maxFileSize: yup.number().required(),
      usedByRelation: yup.string().required(),
      uploadRoles: yup.array().of(yup.string().required()),
    })
  ),
});

export type StorageConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof storageSchema>
>;

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
