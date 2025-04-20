import {
  makeImportAndFilePath,
  tsCodeFragment,
  tsImportBuilder,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { authHooksProvider } from '@src/generators/auth/auth-hooks/auth-hooks.generator.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/react-components.generator.js';
import { reactErrorProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { reactRoutesProvider } from '@src/providers/routes.js';
import { createRouteElement } from '@src/utils/routes.js';

const descriptorSchema = z.object({});

export const auth0CallbackGenerator = createGenerator({
  name: 'auth0/auth0-callback',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        reactComponents: reactComponentsProvider,
        authHooks: authHooksProvider,
        reactError: reactErrorProvider,
        reactRoutes: reactRoutesProvider,
      },
      run({ typescript, reactComponents, authHooks, reactError, reactRoutes }) {
        const [callbackPageImport, callbackPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/auth0-callback.page.tsx`,
        );
        const [signupPageImport, signupPagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/signup.page.tsx`,
        );

        return {
          build: async (builder) => {
            reactRoutes.registerRoute({
              path: 'auth0-callback',
              element: createRouteElement(
                'Auth0CallbackPage',
                callbackPageImport,
              ),
            });

            await builder.apply(
              typescript.createCopyAction({
                source: 'auth0-callback.page.tsx',
                destination: callbackPagePath,
                importMappers: [reactComponents, authHooks, reactError],
              }),
            );
            reactRoutes.registerRoute({
              path: 'signup',
              element: tsCodeFragment(
                `<SignupPage />`,
                tsImportBuilder().default('SignupPage').from(signupPageImport),
              ),
            });

            await builder.apply(
              typescript.createCopyAction({
                source: 'signup.page.tsx',
                destination: signupPagePath,
                importMappers: [reactComponents, reactError],
              }),
            );
          },
        };
      },
    }),
  }),
});
