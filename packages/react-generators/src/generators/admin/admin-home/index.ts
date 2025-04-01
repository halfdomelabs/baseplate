import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { authHooksProvider } from '@src/generators/auth/auth-hooks/index.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactRoutesProvider } from '@src/providers/routes.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type AdminHomeProvider = unknown;

export const adminHomeProvider =
  createProviderType<AdminHomeProvider>('admin-home');

export const adminHomeGenerator = createGenerator({
  name: 'admin/admin-home',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => [
    createGeneratorTask({
      name: 'main',
      dependencies: {
        reactComponents: reactComponentsProvider,
        authHooks: authHooksProvider,
        typescript: typescriptProvider,
        reactRoutes: reactRoutesProvider,
      },
      exports: {
        adminHome: adminHomeProvider.export(projectScope),
      },
      run({ authHooks, reactComponents, reactRoutes, typescript }) {
        const [pageImport, pagePath] = makeImportAndFilePath(
          `${reactRoutes.getDirectoryBase()}/Home/index.tsx`,
        );
        reactRoutes.registerRoute({
          index: true,
          element: TypescriptCodeUtils.createExpression(
            `<Home />`,
            `import Home from '${pageImport}';`,
          ),
          layoutKey: 'admin',
        });

        return {
          providers: {
            adminHome: {},
          },
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'Home.page.tsx',
                destination: pagePath,
                importMappers: [authHooks, reactComponents],
              }),
            );
          },
        };
      },
    }),
  ],
});
