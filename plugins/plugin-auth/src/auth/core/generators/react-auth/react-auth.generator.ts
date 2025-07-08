import { packageScope } from '@baseplate-dev/core-generators';
import { reactAuthProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

/**
 * Generator for basic React auth integrations
 */
export const reactAuthGenerator = createGenerator({
  name: 'react/react-auth',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    reactAuth: createGeneratorTask({
      exports: {
        reactAuth: reactAuthProvider.export(packageScope),
      },
      run() {
        return {
          providers: {
            reactAuth: {
              getLoginUrlPath: () => '/auth/login',
              getRegisterUrlPath: () => '/auth/register',
            },
          },
        };
      },
    }),
  }),
});
