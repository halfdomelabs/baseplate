import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { BETTER_AUTH_BETTER_AUTH_PAGES_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const betterAuthPagesGenerator = createGenerator({
  name: 'better-auth/better-auth-pages',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: BETTER_AUTH_BETTER_AUTH_PAGES_GENERATED.paths.task,
    renderers: BETTER_AUTH_BETTER_AUTH_PAGES_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: BETTER_AUTH_BETTER_AUTH_PAGES_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.pagesGroup.render({}));
          },
        };
      },
    }),
  }),
});
