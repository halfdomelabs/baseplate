import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { fastifyStripeImportsProvider } from '#src/stripe/core/generators/fastify-stripe/generated/ts-import-providers.js';

const pluginsWebhook = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'plugins',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyStripeImports: fastifyStripeImportsProvider,
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

const service = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'service',
  projectExports: { stripe: { isTypeOnly: false } },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/stripe.ts'),
  },
  variables: {},
});

export const servicesGroup = { service };

const serviceEventHandlers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'webhook-services',
  importMapProviders: {},
  name: 'service-event-handlers',
  projectExports: { stripeEventHandlers: { isTypeOnly: false } },
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
  servicesGroup,
  webhookServicesGroup,
};
