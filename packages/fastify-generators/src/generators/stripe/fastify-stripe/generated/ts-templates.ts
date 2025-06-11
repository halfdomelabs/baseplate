import {
  createTsTemplateFile,
  createTsTemplateGroup,
} from '@baseplate-dev/core-generators';

import { configServiceImportsProvider } from '../../../core/config-service/generated/ts-import-providers.js';
import { errorHandlerServiceImportsProvider } from '../../../core/error-handler-service/generated/ts-import-providers.js';
import { loggerServiceImportsProvider } from '../../../core/logger-service/generated/ts-import-providers.js';

const pluginsWebhook = createTsTemplateFile({
  group: 'plugins',
  importMapProviders: {
    configServiceImports: configServiceImportsProvider,
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
  },
  name: 'plugins-webhook',
  projectExports: {},
  source: { path: 'plugins/stripe-webhook.ts' },
  variables: {},
});

const pluginsWebhookTest = createTsTemplateFile({
  group: 'plugins',
  name: 'plugins-webhook-test',
  projectExports: {},
  source: { path: 'plugins/stripe-webhook.int.test.ts' },
  variables: {},
});

const pluginsGroup = createTsTemplateGroup({
  templates: {
    pluginsWebhook: {
      destination: 'stripe-webhook.ts',
      template: pluginsWebhook,
    },
    pluginsWebhookTest: {
      destination: 'stripe-webhook.int.test.ts',
      template: pluginsWebhookTest,
    },
  },
});

const service = createTsTemplateFile({
  group: 'services',
  importMapProviders: { configServiceImports: configServiceImportsProvider },
  name: 'service',
  projectExports: { stripe: {} },
  source: { path: 'services/stripe.ts' },
  variables: {},
});

const serviceEvents = createTsTemplateFile({
  group: 'services',
  importMapProviders: { loggerServiceImports: loggerServiceImportsProvider },
  name: 'service-events',
  projectExports: {
    StripeEventHandler: { isTypeOnly: true },
    stripeEventService: {},
  },
  source: { path: 'services/stripe-events.ts' },
  variables: {},
});

const servicesGroup = createTsTemplateGroup({
  templates: {
    service: { destination: 'stripe.ts', template: service },
    serviceEvents: { destination: 'stripe-events.ts', template: serviceEvents },
  },
});

export const STRIPE_FASTIFY_STRIPE_TS_TEMPLATES = {
  pluginsGroup,
  servicesGroup,
};
