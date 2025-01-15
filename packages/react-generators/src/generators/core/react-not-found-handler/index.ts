import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createProviderType } from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ReactRoute } from '@src/providers/routes.js';

import { reactRoutesProvider } from '@src/providers/routes.js';

import { reactComponentsProvider } from '../react-components/index.js';

const descriptorSchema = z.object({
  layoutKey: z.string().optional(),
});

export interface ReactNotFoundProvider {
  getNotFoundRoute(): ReactRoute;
}

export const reactNotFoundProvider =
  createProviderType<ReactNotFoundProvider>('react-not-found');

export const reactNotFoundHandlerGenerator = createGenerator({
  name: 'core/react-not-found-handler',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, { layoutKey }) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        reactPages: reactRoutesProvider,
        reactComponents: reactComponentsProvider,
        typescript: typescriptProvider,
      },
      exports: {
        reactNotFound: reactNotFoundProvider.export(projectScope),
      },
      run({ reactPages, reactComponents, typescript }) {
        const [notFoundPageImport, notFoundPagePath] = makeImportAndFilePath(
          `${reactPages.getDirectoryBase()}/NotFound.page.tsx`,
        );

        const notFoundRoute = {
          path: '*',
          element: TypescriptCodeUtils.createExpression(
            `<NotFoundPage />`,
            `import NotFoundPage from '${notFoundPageImport}';`,
            {
              importMappers: [reactComponents],
            },
          ),
        };

        reactPages.registerRoute({
          ...notFoundRoute,
          layoutKey,
        });
        return {
          getProviders: () => ({
            reactNotFound: {
              getNotFoundRoute: () => notFoundRoute,
            },
          }),
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'NotFound.page.tsx',
                destination: notFoundPagePath,
                importMappers: [reactComponents],
              }),
            );
          },
        };
      },
    });
  },
});
