import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

const pluginsWebhook = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'plugins',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'plugins-webhook',
  referencedGeneratorTemplates: { service: {}, serviceEvents: {} },
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

const serviceEvents = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'services',
  importMapProviders: { loggerServiceImports: loggerServiceImportsProvider },
  name: 'service-events',
  projectExports: {
    StripeEventHandler: { isTypeOnly: true },
    stripeEventService: { isTypeOnly: false },
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
