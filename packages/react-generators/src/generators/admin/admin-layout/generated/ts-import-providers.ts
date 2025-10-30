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

import { ADMIN_ADMIN_LAYOUT_PATHS } from './template-paths.js';

export const adminLayoutImportsSchema = createTsImportMapSchema({ Route: {} });

export type AdminLayoutImportsProvider = TsImportMapProviderFromSchema<
  typeof adminLayoutImportsSchema
>;

export const adminLayoutImportsProvider =
  createReadOnlyProviderType<AdminLayoutImportsProvider>(
    'admin-layout-imports',
  );

const adminAdminLayoutImportsTask = createGeneratorTask({
  dependencies: {
    paths: ADMIN_ADMIN_LAYOUT_PATHS.provider,
  },
  exports: {
    adminLayoutImports: adminLayoutImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        adminLayoutImports: createTsImportMap(adminLayoutImportsSchema, {
          Route: paths.adminRoute,
        }),
      },
    };
  },
});

export const ADMIN_ADMIN_LAYOUT_IMPORTS = {
  task: adminAdminLayoutImportsTask,
};
