import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH_USER_SESSION_TYPES_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const userSessionTypesGenerator = createGenerator({
  name: 'auth/user-session-types',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: AUTH_USER_SESSION_TYPES_GENERATED.paths.task,
    imports: AUTH_USER_SESSION_TYPES_GENERATED.imports.task,
    renderers: AUTH_USER_SESSION_TYPES_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: AUTH_USER_SESSION_TYPES_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.userSessionTypes.render({}));
          },
        };
      },
    }),
  }),
});
