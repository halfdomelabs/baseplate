import {
  createNodePackagesTask,
  extractPackageVersions,
} from '@baseplate-dev/core-generators';
import {
  configServiceProvider,
  FASTIFY_PACKAGES,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { STRIPE_FASTIFY_STRIPE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const fastifyStripeGenerator = createGenerator({
  name: 'stripe/fastify-stripe',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: STRIPE_FASTIFY_STRIPE_GENERATED.paths.task,
    imports: STRIPE_FASTIFY_STRIPE_GENERATED.imports.task,
    renderers: STRIPE_FASTIFY_STRIPE_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['stripe']),
    }),
    configService: createProviderTask(
      configServiceProvider,
      (configService) => {
        configService.configFields.set('STRIPE_SECRET_KEY', {
          comment: 'Stripe secret API key',
          validator: 'z.string().min(1)',
          seedValue: 'STRIPE_SECRET_KEY',
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        renderers: STRIPE_FASTIFY_STRIPE_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.servicesGroup.render({}));
          },
        };
      },
    }),
  }),
});
