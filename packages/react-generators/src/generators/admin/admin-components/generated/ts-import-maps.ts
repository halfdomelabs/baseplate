import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
} from '@baseplate-dev/core-generators';
import { createReadOnlyProviderType } from '@baseplate-dev/sync';
import path from 'node:path/posix';

const adminComponentsImportsSchema = createTsImportMapSchema({
  DescriptionList: { name: 'default' },
  EmbeddedListFormProps: { isTypeOnly: true },
  EmbeddedListInput: { name: 'default' },
  EmbeddedListTableProps: { isTypeOnly: true },
  EmbeddedObjectFormProps: { isTypeOnly: true },
  EmbeddedObjectInput: { name: 'default' },
});

export type AdminComponentsImportsProvider = TsImportMapProviderFromSchema<
  typeof adminComponentsImportsSchema
>;

export const adminComponentsImportsProvider =
  createReadOnlyProviderType<AdminComponentsImportsProvider>(
    'admin-components-imports',
  );

export function createAdminComponentsImports(
  importBase: string,
): AdminComponentsImportsProvider {
  if (!importBase.startsWith('@/')) {
    throw new Error('importBase must start with @/');
  }

  return createTsImportMap(adminComponentsImportsSchema, {
    DescriptionList: path.join(importBase, 'DescriptionList/index.js'),
    EmbeddedListFormProps: path.join(importBase, 'EmbeddedListInput/index.js'),
    EmbeddedListInput: path.join(importBase, 'EmbeddedListInput/index.js'),
    EmbeddedListTableProps: path.join(importBase, 'EmbeddedListInput/index.js'),
    EmbeddedObjectFormProps: path.join(
      importBase,
      'EmbeddedObjectInput/index.js',
    ),
    EmbeddedObjectInput: path.join(importBase, 'EmbeddedObjectInput/index.js'),
  });
}
