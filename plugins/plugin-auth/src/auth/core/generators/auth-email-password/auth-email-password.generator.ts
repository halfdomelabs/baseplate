import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { AUTH_CORE_AUTH_EMAIL_PASSWORD_GENERATED as GENERATED_TEMPLATES } from './generated';

const descriptorSchema = z.object({});

/**
 * Sets up email / password authentication
 */
export const authEmailPasswordGenerator = createGenerator({
  name: 'auth/core/auth-email-password',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: GENERATED_TEMPLATES.paths.task,
    imports: GENERATED_TEMPLATES.imports.task,
    renderers: GENERATED_TEMPLATES.renderers.task,
    appModule: createGeneratorTask({
      dependencies: {
        paths: GENERATED_TEMPLATES.paths.provider,
        appModule: appModuleProvider,
      },
      run({ paths, appModule }) {
        appModule.moduleImports.push(paths.schemaUserPasswordMutations);
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        renderers: GENERATED_TEMPLATES.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.moduleGroup.render({}));
          },
        };
      },
    }),
  }),
});
