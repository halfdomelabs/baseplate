import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { STRIPE_BILLING_MODULE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for billing module files (billing.service.ts, billing-config.ts).
 *
 * Placed inside a feature module via addChildrenToFeature, giving it access
 * to {module-root} for path resolution.
 */
export const billingModuleGenerator = createGenerator({
  name: 'stripe/billing-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: STRIPE_BILLING_MODULE_GENERATED.paths.task,
    imports: STRIPE_BILLING_MODULE_GENERATED.imports.task,
    renderers: STRIPE_BILLING_MODULE_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: STRIPE_BILLING_MODULE_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.moduleGroup.render({}));
          },
        };
      },
    }),
  }),
});
