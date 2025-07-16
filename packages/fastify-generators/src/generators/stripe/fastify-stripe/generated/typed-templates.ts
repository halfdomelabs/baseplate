import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import path from 'node:path';

import { configServiceImportsProvider } from '#src/generators/core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '#src/generators/core/error-handler-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '#src/generators/core/logger-service/generated/ts-import-providers.js';

const pluginsWebhook = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'plugins',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'plugins-webhook',
  referencedGeneratorTemplates: { serviceEvents: {}, service: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/stripe-webhook.ts',
    ),
  },
  variables: {},
});

const pluginsWebhookTest = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'plugins',
  importMapProviders: {},
  name: 'plugins-webhook-test',
  referencedGeneratorTemplates: {
    serviceEvents: {},
    service: {},
    pluginsWebhook: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/plugins/stripe-webhook.int.test.ts',
    ),
  },
  variables: {},
});

export const pluginsGroup = { pluginsWebhook, pluginsWebhookTest };

const service = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'service',
  projectExports: { stripe: {} },
  source: {
    path: path.join(import.meta.dirname, '../templates/src/services/stripe.ts'),
  },
  variables: {},
});

const serviceEvents = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: { loggerServiceImports: loggerServiceImportsProvider },
  name: 'service-events',
  projectExports: {
    StripeEventHandler: { isTypeOnly: true },
    stripeEventService: {},
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/src/services/stripe-events.ts',
    ),
  },
  variables: {},
});

export const servicesGroup = { service, serviceEvents };

export const STRIPE_FASTIFY_STRIPE_TEMPLATES = { pluginsGroup, servicesGroup };
