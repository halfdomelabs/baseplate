import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/react-components.generator.js';
import { reactRoutesProvider } from '#src/providers/routes.js';
import { createRouteElement } from '#src/utils/routes.js';

import { ADMIN_ADMIN_HOME_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const adminHomeGenerator = createGenerator({
  name: 'admin/admin-home',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    main: createGeneratorTask({
      dependencies: {
        reactComponentsImports: reactComponentsImportsProvider,
        authHooksImports: authHooksImportsProvider,
        typescriptFile: typescriptFileProvider,
        reactRoutes: reactRoutesProvider,
      },
      run({
        authHooksImports,
        reactComponentsImports,
        reactRoutes,
        typescriptFile,
      }) {
        const pagePath = `${reactRoutes.getDirectoryBase()}/Home/index.tsx`;

        reactRoutes.registerRoute({
          index: true,
          element: createRouteElement('Home', pagePath),
          layoutKey: 'admin',
        });

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_HOME_TS_TEMPLATES.home,
                destination: pagePath,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
