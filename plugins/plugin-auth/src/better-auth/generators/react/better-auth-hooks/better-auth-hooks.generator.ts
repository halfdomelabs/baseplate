import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import { BETTER_AUTH_BETTER_AUTH_HOOKS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  authRoles: z.array(z.string()).default([]),
});

export const betterAuthHooksGenerator = createGenerator({
  name: 'better-auth/better-auth-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ authRoles }) => ({
    paths: BETTER_AUTH_BETTER_AUTH_HOOKS_GENERATED.paths.task,
    imports: BETTER_AUTH_BETTER_AUTH_HOOKS_GENERATED.imports.task,
    renderers: BETTER_AUTH_BETTER_AUTH_HOOKS_GENERATED.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: BETTER_AUTH_BETTER_AUTH_HOOKS_GENERATED.renderers.provider,
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
