import { typescriptFileProvider } from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import path from 'node:path/posix';
import { z } from 'zod';

import { authHooksImportsProvider } from '@src/generators/auth/index.js';
import { reactComponentsImportsProvider } from '@src/generators/core/react-components/react-components.generator.js';
import { reactErrorImportsProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { reactRoutesProvider } from '@src/providers/routes.js';
import { createRouteElement } from '@src/utils/routes.js';

import { AUTH_0_AUTH_0_CALLBACK_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const auth0CallbackGenerator = createGenerator({
  name: 'auth0/auth0-callback',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        authHooksImports: authHooksImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
        reactRoutes: reactRoutesProvider,
      },
      run({
        typescriptFile,
        reactComponentsImports,
        authHooksImports,
        reactErrorImports,
        reactRoutes,
      }) {
        const callbackPagePath = path.join(
          reactRoutes.getDirectoryBase(),
          'auth0-callback.page.tsx',
        );
        const signupPagePath = path.join(
          reactRoutes.getDirectoryBase(),
          'signup.page.tsx',
        );

        return {
          build: async (builder) => {
            // Callback page
            reactRoutes.registerRoute({
              path: 'auth0-callback',
              element: createRouteElement(
                'Auth0CallbackPage',
                callbackPagePath,
              ),
            });

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_0_AUTH_0_CALLBACK_TS_TEMPLATES.auth0CallbackPage,
                destination: callbackPagePath,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                  reactErrorImports,
                },
              }),
            );

            // Signup page
            reactRoutes.registerRoute({
              path: 'signup',
              element: createRouteElement('SignupPage', signupPagePath),
            });

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: AUTH_0_AUTH_0_CALLBACK_TS_TEMPLATES.signupPage,
                destination: signupPagePath,
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
