import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { ADMIN_ADMIN_COMPONENTS_PATHS } from './template-paths.js';

export const adminComponentsImportsSchema = createTsImportMapSchema({
  EmbeddedListField: {},
  EmbeddedListFieldController: {},
  EmbeddedListFieldProps: { isTypeOnly: true },
  EmbeddedListFormProps: { isTypeOnly: true },
  EmbeddedListInput: {},
  EmbeddedListTableProps: { isTypeOnly: true },
  EmbeddedObjectField: {},
  EmbeddedObjectFieldController: {},
  EmbeddedObjectFieldProps: { isTypeOnly: true },
  EmbeddedObjectFormProps: { isTypeOnly: true },
  EmbeddedObjectInput: {},
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
    adminComponentsImports: adminComponentsImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        adminComponentsImports: createTsImportMap(
          adminComponentsImportsSchema,
          {
            EmbeddedListField: paths.embeddedListField,
            EmbeddedListFieldController: paths.embeddedListField,
            EmbeddedListFieldProps: paths.embeddedListField,
            EmbeddedListFormProps: paths.embeddedListInput,
            EmbeddedListInput: paths.embeddedListInput,
            EmbeddedListTableProps: paths.embeddedListInput,
            EmbeddedObjectField: paths.embeddedObjectField,
            EmbeddedObjectFieldController: paths.embeddedObjectField,
            EmbeddedObjectFieldProps: paths.embeddedObjectField,
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
