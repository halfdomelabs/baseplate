import { renderTextTemplateFileAction } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH_CORE_AUTH_ROUTES_GENERATED as GENERATED_TEMPLATES } from './generated/index.js';

const descriptorSchema = z.object({});

/**
 * Generator for auth routes for logging in and registering
 */
export const authRoutesGenerator = createGenerator({
  name: 'auth/core/auth-routes',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
        paths: GENERATED_TEMPLATES.paths.provider,
      },
      run({ renderers, paths }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.mainGroup.render({
                variables: {},
              }),
            );
            await builder.apply(
              renderTextTemplateFileAction({
                destination: paths.queriesGql,
                template: GENERATED_TEMPLATES.templates.queriesGql,
                variables: {},
              }),
            );
          },
        };
      },
    }),
  }),
});
