import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { PLACEHOLDER_AUTH_CORE_AUTH_MODULE_GENERATED } from './generated';

const descriptorSchema = z.object({});

export const authModuleGenerator = createGenerator({
  name: 'placeholder-auth/core/auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: PLACEHOLDER_AUTH_CORE_AUTH_MODULE_GENERATED.paths.task,
    imports: PLACEHOLDER_AUTH_CORE_AUTH_MODULE_GENERATED.imports.task,
    renderers: PLACEHOLDER_AUTH_CORE_AUTH_MODULE_GENERATED.renderers.task,
    authService: createGeneratorTask({
      dependencies: {
        renderers:
          PLACEHOLDER_AUTH_CORE_AUTH_MODULE_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          async build(builder) {
            await builder.apply(renderers.userSessionService.render({}));
          },
        };
      },
    }),
  }),
});
