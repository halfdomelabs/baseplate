import {
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import type { ReactRoute } from '@src/providers/routes.js';

import { reactRoutesProvider } from '@src/providers/routes.js';

import { reactComponentsImportsProvider } from '../react-components/react-components.generator.js';
import { CORE_REACT_NOT_FOUND_HANDLER_TS_TEMPLATES } from './generated/ts-templates.js';

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
  buildTasks: ({ layoutKey }) => ({
    main: createGeneratorTask({
      dependencies: {
        reactPages: reactRoutesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
      },
      exports: {
        reactNotFound: reactNotFoundProvider.export(projectScope),
      },
      run({ reactPages, reactComponentsImports, typescriptFile }) {
        const [notFoundPageImport, notFoundPagePath] = makeImportAndFilePath(
          `${reactPages.getDirectoryBase()}/NotFound.page.tsx`,
        );

        const notFoundRoute = {
          path: '*',
          element: TypescriptCodeUtils.createExpression(
            `<NotFoundPage />`,
            `import NotFoundPage from '${notFoundPageImport}';`,
          ),
        };

        reactPages.registerRoute({
          ...notFoundRoute,
          layoutKey,
        });
        return {
          providers: {
            reactNotFound: {
              getNotFoundRoute: () => notFoundRoute,
            },
          },
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_REACT_NOT_FOUND_HANDLER_TS_TEMPLATES.notFoundPage,
                destination: notFoundPagePath,
                importMapProviders: {
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
