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

import { EMAIL_TRANSACTIONAL_LIB_PATHS } from './template-paths.js';

export const transactionalLibImportsSchema = createTsImportMapSchema({
  defineEmail: {},
  DefineEmailOptions: { isTypeOnly: true },
  EmailComponent: { isTypeOnly: true },
  renderEmail: {},
});

export type TransactionalLibImportsProvider = TsImportMapProviderFromSchema<
  typeof transactionalLibImportsSchema
>;

export const transactionalLibImportsProvider =
  createReadOnlyProviderType<TransactionalLibImportsProvider>(
    'transactional-lib-imports',
  );

const emailTransactionalLibImportsTask = createGeneratorTask({
  dependencies: {
    paths: EMAIL_TRANSACTIONAL_LIB_PATHS.provider,
  },
  exports: {
    transactionalLibImports:
      transactionalLibImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        transactionalLibImports: createTsImportMap(
          transactionalLibImportsSchema,
          {
            defineEmail: paths.typesEmailComponent,
            DefineEmailOptions: paths.typesEmailComponent,
            EmailComponent: paths.typesEmailComponent,
            renderEmail: paths.servicesRenderEmail,
          },
        ),
      },
    };
  },
});

export const EMAIL_TRANSACTIONAL_LIB_IMPORTS = {
  task: emailTransactionalLibImportsTask,
};
