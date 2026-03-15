import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface StripeBillingWebhookPaths {
  pluginsWebhook: string;
  serviceEventHandlers: string;
}

const stripeBillingWebhookPaths = createProviderType<StripeBillingWebhookPaths>(
  'stripe-billing-webhook-paths',
);

const stripeBillingWebhookPathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { stripeBillingWebhookPaths: stripeBillingWebhookPaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        stripeBillingWebhookPaths: {
          pluginsWebhook: `${srcRoot}/plugins/stripe-webhook.ts`,
          serviceEventHandlers: `${srcRoot}/services/stripe-event-handlers.ts`,
        },
      },
    };
  },
});

export const STRIPE_BILLING_WEBHOOK_PATHS = {
  provider: stripeBillingWebhookPaths,
  task: stripeBillingWebhookPathsTask,
};
