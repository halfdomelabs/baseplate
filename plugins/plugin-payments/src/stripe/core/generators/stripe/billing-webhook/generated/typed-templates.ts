import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { fastifyStripeImportsProvider } from '#src/stripe/core/generators/fastify-stripe/generated/ts-import-providers.js';
import { billingModuleImportsProvider } from '#src/stripe/core/generators/stripe/billing-module/generated/ts-import-providers.js';

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

const serviceEventHandlers = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: { billingModuleImports: billingModuleImportsProvider },
  name: 'service-event-handlers',
  projectExports: { stripeEventHandlers: { isTypeOnly: false } },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/stripe-event-handlers.ts',
    ),
  },
  variables: {},
});

export const servicesGroup = { serviceEventHandlers };

export const STRIPE_BILLING_WEBHOOK_TEMPLATES = { pluginsGroup, servicesGroup };
