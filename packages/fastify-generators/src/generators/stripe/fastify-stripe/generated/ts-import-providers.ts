import type { TsImportMapProviderFromSchema } from '@baseplate-dev/core-generators';

import {
  createTsImportMap,
  createTsImportMapSchema,
  projectScope,
} from '@baseplate-dev/core-generators';
import {
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';

import { STRIPE_FASTIFY_STRIPE_PATHS } from './template-paths.js';

const fastifyStripeImportsSchema = createTsImportMapSchema({
  stripe: {},
  StripeEventHandler: { isTypeOnly: true },
  stripeEventService: {},
});

export type FastifyStripeImportsProvider = TsImportMapProviderFromSchema<
  typeof fastifyStripeImportsSchema
>;

export const fastifyStripeImportsProvider =
  createReadOnlyProviderType<FastifyStripeImportsProvider>(
    'fastify-stripe-imports',
  );

const stripeFastifyStripeImportsTask = createGeneratorTask({
  dependencies: {
    paths: STRIPE_FASTIFY_STRIPE_PATHS.provider,
  },
  exports: {
    fastifyStripeImports: fastifyStripeImportsProvider.export(projectScope),
  },
  run({ paths }) {
    return {
      providers: {
        fastifyStripeImports: createTsImportMap(fastifyStripeImportsSchema, {
          stripe: paths.service,
          StripeEventHandler: paths.serviceEvents,
          stripeEventService: paths.serviceEvents,
        }),
      },
    };
  },
});

export const STRIPE_FASTIFY_STRIPE_IMPORTS = {
  task: stripeFastifyStripeImportsTask,
};
