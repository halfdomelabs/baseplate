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

import { EMAIL_CORE_EMAIL_MODULE_PATHS } from './template-paths.js';

export const emailModuleImportsSchema = createTsImportMapSchema({
  createEmailService: {},
  createEmailTransport: {},
  EmailAdapter: { isTypeOnly: true },
  EmailAttachment: { isTypeOnly: true },
  EmailRawOptions: { isTypeOnly: true },
  EmailSendOptions: { isTypeOnly: true },
  EmailService: { isTypeOnly: true },
  EmailTransport: { isTypeOnly: true },
  sendEmailQueue: {},
  sendEmailWorker: {},
  TransformedEmailMessage: { isTypeOnly: true },
});

export type EmailModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof emailModuleImportsSchema
>;

export const emailModuleImportsProvider =
  createReadOnlyProviderType<EmailModuleImportsProvider>(
    'email-module-imports',
  );

const emailCoreEmailModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: EMAIL_CORE_EMAIL_MODULE_PATHS.provider,
  },
  exports: {
    emailModuleImports: emailModuleImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        emailModuleImports: createTsImportMap(emailModuleImportsSchema, {
          createEmailService: paths.emailsService,
          createEmailTransport: paths.emailsService,
          EmailAdapter: paths.emailsTypes,
          EmailAttachment: paths.emailsTypes,
          EmailRawOptions: paths.emailsTypes,
          EmailSendOptions: paths.emailsTypes,
          EmailService: paths.emailsService,
          EmailTransport: paths.emailsTypes,
          sendEmailQueue: paths.sendEmailQueue,
          sendEmailWorker: paths.sendEmailWorker,
          TransformedEmailMessage: paths.emailsTypes,
        }),
      },
    };
  },
});

export const EMAIL_CORE_EMAIL_MODULE_IMPORTS = {
  task: emailCoreEmailModuleImportsTask,
};
