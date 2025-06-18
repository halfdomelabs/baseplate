import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { ADMIN_ADMIN_COMPONENTS_PATHS } from './template-paths.js';

const adminComponentsImportsSchema = createTsImportMapSchema({
  DescriptionList: { exportedAs: 'default' },
  EmbeddedListFormProps: { isTypeOnly: true },
  EmbeddedListInput: { exportedAs: 'default' },
  EmbeddedListTableProps: { isTypeOnly: true },
  EmbeddedObjectFormProps: { isTypeOnly: true },
  EmbeddedObjectInput: { exportedAs: 'default' },
});

export type AdminComponentsImportsProvider = TsImportMapProviderFromSchema<
  typeof adminComponentsImportsSchema
>;

export const adminComponentsImportsProvider =
  createReadOnlyProviderType<AdminComponentsImportsProvider>(
    'admin-components-imports',
  );

const adminAdminComponentsImportsTask = createGeneratorTask({
  dependencies: {
    paths: ADMIN_ADMIN_COMPONENTS_PATHS.provider,
  },
  exports: {
    adminComponentsImports: adminComponentsImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        adminComponentsImports: createTsImportMap(
          adminComponentsImportsSchema,
          {
            DescriptionList: paths.descriptionList,
            EmbeddedListFormProps: paths.embeddedListInput,
            EmbeddedListInput: paths.embeddedListInput,
            EmbeddedListTableProps: paths.embeddedListInput,
            EmbeddedObjectFormProps: paths.embeddedObjectInput,
            EmbeddedObjectInput: paths.embeddedObjectInput,
          },
        ),
      },
    };
  },
});

export const ADMIN_ADMIN_COMPONENTS_IMPORTS = {
  task: adminAdminComponentsImportsTask,
};
