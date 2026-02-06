import { nodeProvider } from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { RATE_LIMIT_CORE_RATE_LIMIT_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for rate-limit/core/rate-limit
 */
export const rateLimitGenerator = createGenerator({
  name: 'rate-limit/core/rate-limit',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    imports: GENERATED_TEMPLATES.imports.task,
    // Add rate-limiter-flexible package dependency
    node: createProviderTask(nodeProvider, (node) => {
      node.packages.addProdPackages({
        'rate-limiter-flexible': '9.1.0',
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.typesGroup.render({}));
            await builder.apply(
              renderers.rateLimiterService.render({
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
