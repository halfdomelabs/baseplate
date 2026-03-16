import { createTsTemplateFile } from '@baseplate-dev/core-generators';
import {
  authRolesImportsProvider,
  configServiceImportsProvider,
  errorHandlerServiceImportsProvider,
  loggerServiceImportsProvider,
  prismaGeneratedImportsProvider,
  prismaImportsProvider,
} from '@baseplate-dev/fastify-generators';
import path from 'node:path';

import { fastifyStripeImportsProvider } from '#src/stripe/core/generators/fastify-stripe/generated/ts-import-providers.js';

const billingConfig = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {
    authRolesImports: authRolesImportsProvider,
    configServiceImports: configServiceImportsProvider,
  },
  name: 'billing-config',
  projectExports: {
    getPlanKeyByPriceId: { isTypeOnly: false },
    PlanKey: { isTypeOnly: true },
    SUBSCRIPTION_PLANS: { isTypeOnly: false },
  },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/billing-config.ts',
    ),
  },
  variables: { TPL_PLANS: {} },
});

const billingService = createTsTemplateFile({
  fileOptions: { kind: 'singleton' },
  group: 'module',
  importMapProviders: {
    errorHandlerServiceImports: errorHandlerServiceImportsProvider,
    fastifyStripeImports: fastifyStripeImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    prismaGeneratedImports: prismaGeneratedImportsProvider,
    prismaImports: prismaImportsProvider,
  },
  name: 'billing-service',
  projectExports: {
    getOrCreateBillingAccount: { isTypeOnly: false },
    handleSubscriptionEvent: { isTypeOnly: false },
    syncSubscriptionFromStripe: { isTypeOnly: false },
  },
  referencedGeneratorTemplates: { billingConfig: {} },
  source: {
    path: path.join(
      import.meta.dirname,
      '../templates/module/services/billing.service.ts',
    ),
  },
  variables: {},
});

export const moduleGroup = { billingConfig, billingService };

export const STRIPE_BILLING_MODULE_TEMPLATES = { moduleGroup };
