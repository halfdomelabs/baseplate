import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface EmailCoreEmailModulePaths {
  emailsService: string;
  emailsTypes: string;
  sendEmailQueue: string;
  sendEmailWorker: string;
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
          emailsService: `${moduleRoot}/services/emails.service.ts`,
          emailsTypes: `${moduleRoot}/emails.types.ts`,
          sendEmailQueue: `${moduleRoot}/queues/send-email.queue.ts`,
          sendEmailWorker: `${moduleRoot}/queues/send-email.worker.ts`,
        },
      },
    };
  },
});

export const EMAIL_CORE_EMAIL_MODULE_PATHS = {
  provider: emailCoreEmailModulePaths,
  task: emailCoreEmailModulePathsTask,
};
