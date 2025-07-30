import { packageScope } from '@baseplate-dev/core-generators';
import { reactAuthRoutesProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

/**
 * Generator for basic React auth integrations
 */
export const reactAuthGenerator = createGenerator({
  name: 'local-auth/core/react-auth',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    reactAuth: createGeneratorTask({
      exports: {
        reactAuthRoutes: reactAuthRoutesProvider.export(packageScope),
      },
      run() {
        return {
          providers: {
            reactAuthRoutes: {
              getLoginUrlPath: () => '/auth/login',
              getRegisterUrlPath: () => '/auth/register',
            },
          },
        };
      },
    }),
  }),
});
