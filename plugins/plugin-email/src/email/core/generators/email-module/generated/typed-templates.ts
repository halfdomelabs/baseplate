import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  loggerServiceImportsProvider,
  serviceContextImportsProvider,
} from '@baseplate-dev/fastify-generators';
import { queuesImportsProvider } from '@baseplate-dev/plugin-queue';
import path from 'node:path';

import { transactionalLibImportsProvider } from '#src/email/transactional-lib/generators/transactional-lib/generated/ts-import-providers.js';

const emailService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    queuesImports: queuesImportsProvider,
    transactionalLibImports: transactionalLibImportsProvider,
  },
  name: 'email-service',
  projectExports: {
    createEmailService: { isTypeOnly: false },
    createEmailTransport: { isTypeOnly: false },
    EmailService: { isTypeOnly: true },
  },
  referencedGeneratorTemplates: { emailTypes: {}, sendEmailQueue: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/email.service.ts',
    ),
  },
  variables: {},
});

const emailTypes = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'email-types',
  projectExports: {
    EmailAdapter: { isTypeOnly: true },
    EmailAttachment: { isTypeOnly: true },
    EmailRawOptions: { isTypeOnly: true },
    EmailSendOptions: { isTypeOnly: true },
    EmailTransport: { isTypeOnly: true },
    TransformedEmailMessage: { isTypeOnly: true },
  },
  source: {
    path: path.join(import.meta.dirname, '../templates/module/email.types.ts'),
  },
  variables: {},
});

const sendEmailQueue = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'main',
  importMapProviders: { queuesImports: queuesImportsProvider },
  name: 'send-email-queue',
  projectExports: { sendEmailQueue: { isTypeOnly: false } },
  referencedGeneratorTemplates: { emailTypes: {} },
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
    serviceContextImports: serviceContextImportsProvider,
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
  variables: {},
});

export const mainGroup = {
  emailService,
  emailTypes,
  sendEmailQueue,
  sendEmailWorker,
};

export const EMAIL_CORE_EMAIL_MODULE_TEMPLATES = { mainGroup };
