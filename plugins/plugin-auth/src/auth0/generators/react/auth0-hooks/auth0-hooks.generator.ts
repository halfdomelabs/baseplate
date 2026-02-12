import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { AUTH0_AUTH0_HOOKS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  authRoles: z.array(z.string()).default([]),
});

export const auth0HooksGenerator = createGenerator({
  name: 'auth0/auth0-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ authRoles }) => ({
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
                  useSession: {
                    TPL_AUTH_ROLES: TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      [...authRoles].toSorted().map((role) => quot(role)),
                    ),
                  },
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
