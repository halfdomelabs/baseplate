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
  Button: {},
  defineEmail: {},
  DefineEmailOptions: { isTypeOnly: true },
  Divider: {},
  EmailComponent: { isTypeOnly: true },
  EmailLayout: {},
  Heading: {},
  renderEmail: {},
  Section: {},
  Text: {},
  theme: {},
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
            Button: paths.componentsButton,
            defineEmail: paths.typesEmailComponent,
            DefineEmailOptions: paths.typesEmailComponent,
            Divider: paths.componentsDivider,
            EmailComponent: paths.typesEmailComponent,
            EmailLayout: paths.componentsLayout,
            Heading: paths.componentsHeading,
            renderEmail: paths.servicesRenderEmail,
            Section: paths.componentsSection,
            Text: paths.componentsText,
            theme: paths.constantsTheme,
          },
        ),
      },
    };
  },
});

export const EMAIL_TRANSACTIONAL_LIB_IMPORTS = {
  task: emailTransactionalLibImportsTask,
};
