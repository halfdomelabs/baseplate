import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  packageScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { STRIPE_BILLING_MODULE_PATHS } from './template-paths.js';

export const billingModuleImportsSchema = createTsImportMapSchema({
  getOrCreateBillingAccount: {},
  getPlanKeyByPriceId: {},
  handleSubscriptionEvent: {},
  PlanKey: { isTypeOnly: true },
  SUBSCRIPTION_PLANS: {},
  syncSubscriptionFromStripe: {},
});

export type BillingModuleImportsProvider = TsImportMapProviderFromSchema<
  typeof billingModuleImportsSchema
>;

export const billingModuleImportsProvider =
  createReadOnlyProviderType<BillingModuleImportsProvider>(
    'billing-module-imports',
  );

const stripeBillingModuleImportsTask = createGeneratorTask({
  dependencies: {
    paths: STRIPE_BILLING_MODULE_PATHS.provider,
  },
  exports: {
    billingModuleImports: billingModuleImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        billingModuleImports: createTsImportMap(billingModuleImportsSchema, {
          getOrCreateBillingAccount: paths.billingService,
          getPlanKeyByPriceId: paths.billingConfig,
          handleSubscriptionEvent: paths.billingService,
          PlanKey: paths.billingConfig,
          SUBSCRIPTION_PLANS: paths.billingConfig,
          syncSubscriptionFromStripe: paths.billingService,
        }),
      },
    };
  },
});

export const STRIPE_BILLING_MODULE_IMPORTS = {
  task: stripeBillingModuleImportsTask,
};
