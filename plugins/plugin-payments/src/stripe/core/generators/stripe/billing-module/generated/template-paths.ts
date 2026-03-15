import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface StripeBillingModulePaths {
  billingConfig: string;
  billingService: string;
}

const stripeBillingModulePaths = createProviderType<StripeBillingModulePaths>(
  'stripe-billing-module-paths',
);

const stripeBillingModulePathsTask = createGeneratorTask({
  dependencies: { appModule: appModuleProvider },
  exports: { stripeBillingModulePaths: stripeBillingModulePaths.export() },
  run({ appModule }) {
    const moduleRoot = appModule.getModuleFolder();

    return {
      providers: {
        stripeBillingModulePaths: {
          billingConfig: `${moduleRoot}/services/billing-config.ts`,
          billingService: `${moduleRoot}/services/billing.service.ts`,
        },
      },
    };
  },
});

export const STRIPE_BILLING_MODULE_PATHS = {
  provider: stripeBillingModulePaths,
  task: stripeBillingModulePathsTask,
};
