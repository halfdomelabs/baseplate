import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  appRuntimeImportsProvider,
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const pluginsWebhook = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'plugins',
  importMapProviders: {
    appRuntimeImports: appRuntimeImportsProvider,
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
  },
  name: 'plugins-webhook',
  projectExports: { stripeWebhookPlugin: { isTypeOnly: false } },
  referencedGeneratorTemplates: { serviceEventHandlers: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/stripe-webhook.ts',
    ),
  },
  variables: {},
});

export const pluginsGroup = { pluginsWebhook };

const serviceEventHandlers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'webhook-services',
  importMapProviders: {},
  name: 'service-event-handlers',
  projectExports: { createStripeEventHandlers: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/stripe-event-handlers.ts',
    ),
  },
  variables: { TPL_EVENT_HANDLERS: {} },
});

export const webhookServicesGroup = { serviceEventHandlers };

export const STRIPE_FASTIFY_STRIPE_TEMPLATES = {
  pluginsGroup,
  webhookServicesGroup,
};
