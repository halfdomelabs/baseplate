import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { PLACEHOLDER_AUTH_CORE_PLACEHOLDER_AUTH_MODULE_GENERATED as GENERATED_TEMPLATES } from './generated';

const descriptorSchema = z.object({});

export const placeholderAuthModuleGenerator = createGenerator({
  name: 'placeholder-auth/core/placeholder-auth-module',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    authService: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
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
