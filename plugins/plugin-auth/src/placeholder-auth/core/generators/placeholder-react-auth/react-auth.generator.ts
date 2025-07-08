import { packageScope } from '@baseplate-dev/core-generators';
import { reactAuthProvider } from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

const descriptorSchema = z.object({});

/**
 * Generator for placeholder React auth
 */
export const placeholderReactAuthGenerator = createGenerator({
  name: 'placeholder-auth/core/placeholder-react-auth',
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
