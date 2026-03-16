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

import { STRIPE_BILLING_WEBHOOK_PATHS } from './template-paths.js';

export const billingWebhookImportsSchema = createTsImportMapSchema({
  stripeEventHandlers: {},
  stripeWebhookPlugin: {},
});

export type BillingWebhookImportsProvider = TsImportMapProviderFromSchema<
  typeof billingWebhookImportsSchema
>;

export const billingWebhookImportsProvider =
  createReadOnlyProviderType<BillingWebhookImportsProvider>(
    'billing-webhook-imports',
  );

const stripeBillingWebhookImportsTask = createGeneratorTask({
  dependencies: {
    paths: STRIPE_BILLING_WEBHOOK_PATHS.provider,
  },
  exports: {
    billingWebhookImports: billingWebhookImportsProvider.export(packageScope),
  },
  run({ paths }) {
    return {
      providers: {
        billingWebhookImports: createTsImportMap(billingWebhookImportsSchema, {
          stripeEventHandlers: paths.serviceEventHandlers,
          stripeWebhookPlugin: paths.pluginsWebhook,
        }),
      },
    };
  },
});

export const STRIPE_BILLING_WEBHOOK_IMPORTS = {
  task: stripeBillingWebhookImportsTask,
};
