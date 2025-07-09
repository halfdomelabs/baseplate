import { renderTextTemplateFileAction } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH_CORE_AUTH_HOOKS_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Placeholder generator for auth hooks.
 *
 * Useful for creating a test auth implementation.
 */
export const authHooksGenerator = createGenerator({
  name: 'auth/core/auth-hooks',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ paths, renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.hooksGroup.render({}));
            await builder.apply(
              renderTextTemplateFileAction({
                template: GENERATED_TEMPLATES.templates.useCurrentUserGql,
                destination: paths.useCurrentUserGql,
              }),
            );
          },
        };
      },
    }),
  }),
});
