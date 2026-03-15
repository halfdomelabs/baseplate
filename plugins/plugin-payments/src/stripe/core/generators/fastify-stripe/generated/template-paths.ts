import { packageInfoProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

export interface StripeFastifyStripePaths {
  service: string;
}

const stripeFastifyStripePaths = createProviderType<StripeFastifyStripePaths>(
  'stripe-fastify-stripe-paths',
);

const stripeFastifyStripePathsTask = createGeneratorTask({
  dependencies: { packageInfo: packageInfoProvider },
  exports: { stripeFastifyStripePaths: stripeFastifyStripePaths.export() },
  run({ packageInfo }) {
    const srcRoot = packageInfo.getPackageSrcPath();

    return {
      providers: {
        stripeFastifyStripePaths: { service: `${srcRoot}/services/stripe.ts` },
      },
    };
  },
});

export const STRIPE_FASTIFY_STRIPE_PATHS = {
  provider: stripeFastifyStripePaths,
  task: stripeFastifyStripePathsTask,
};
