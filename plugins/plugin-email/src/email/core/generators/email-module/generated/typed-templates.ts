import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { queuesImportsProvider } from '@baseplate-dev/plugin-queue';
import path from 'node:path';

const emailsService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    queuesImports: queuesImportsProvider,
  },
  name: 'emails-service',
  projectExports: {
    sendEmail: { isTypeOnly: false },
    sendRawEmail: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { emailsTypes: {}, sendEmailQueue: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/emails.service.ts',
    ),
  },
  variables: { TPL_EMAIL_COMPONENT: {}, TPL_RENDER_EMAIL: {} },
});

const emailsTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'emails-types',
  projectExports: {
    EmailAdapter: { isTypeOnly: true },
    EmailAttachment: { isTypeOnly: true },
    EmailRawOptions: { isTypeOnly: true },
    EmailSendOptions: { isTypeOnly: true },
    TransformedEmailMessage: { isTypeOnly: true },
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/emails.types.ts'),
  },
  variables: {},
});

const sendEmailQueue = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'send-email-queue',
  projectExports: { sendEmailQueue: { isTypeOnly: false } },
  referencedGeneratorTemplates: { emailsTypes: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/send-email.queue.ts',
    ),
  },
  variables: {},
});

const sendEmailWorker = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    loggerServiceImports: loggerServiceImportsProvider,
    queuesImports: queuesImportsProvider,
  },
  name: 'send-email-worker',
  projectExports: { sendEmailWorker: { isTypeOnly: false } },
  referencedGeneratorTemplates: { sendEmailQueue: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/queues/send-email.worker.ts',
    ),
  },
  variables: { TPL_EMAIL_ADAPTER: {} },
});

export const mainGroup = {
  emailsService,
  emailsTypes,
  sendEmailQueue,
  sendEmailWorker,
};

export const EMAIL_CORE_EMAIL_MODULE_TEMPLATES = { mainGroup };
