import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH0_AUTH0_PAGES_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const auth0PagesGenerator = createGenerator({
  name: 'auth0/auth0-pages',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH0_AUTH0_PAGES_GENERATED.paths.task,
    renderers: AUTH0_AUTH0_PAGES_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: AUTH0_AUTH0_PAGES_GENERATED.renderers.provider,
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
