import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH0_AUTH0_HOOKS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  userQueryName: z.string().default('user'),
});

export const auth0HooksGenerator = createGenerator({
  name: 'auth0/auth0-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ userQueryName }) => ({
    paths: AUTH0_AUTH0_HOOKS_GENERATED.paths.task,
    imports: AUTH0_AUTH0_HOOKS_GENERATED.imports.task,
    renderers: AUTH0_AUTH0_HOOKS_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: AUTH0_AUTH0_HOOKS_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.hooksGroup.render({
                variables: {
                  useCurrentUser: {
                    TPL_USER: userQueryName,
                  },
                },
              }),
            );

            await builder.apply(
              renderers.useCurrentUserGql.render({
                variables: {
                  TPL_USER_QUERY_NAME: userQueryName,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
