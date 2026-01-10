import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface EmailCoreEmailModulePaths {
  emailsService: string;
  emailsTypes: string;
  sendEmailQueue: string;
}

const emailCoreEmailModulePaths = createProviderType<EmailCoreEmailModulePaths>(
  'email-core-email-module-paths',
);

const emailCoreEmailModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { emailCoreEmailModulePaths: emailCoreEmailModulePaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        emailCoreEmailModulePaths: {
          emailsService: `${moduleRoot}/emails/services/emails.service.ts`,
          emailsTypes: `${moduleRoot}/emails/emails.types.ts`,
          sendEmailQueue: `${moduleRoot}/emails/queues/send-email.queue.ts`,
        },
      },
    };
  },
});

export const EMAIL_CORE_EMAIL_MODULE_PATHS = {
  provider: emailCoreEmailModulePaths,
  task: emailCoreEmailModulePathsTask,
};
