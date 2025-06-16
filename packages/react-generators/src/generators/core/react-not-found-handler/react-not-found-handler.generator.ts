import {
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import type { ReactRoute } from '#src/providers/routes.js';

import { reactRoutesProvider } from '#src/providers/routes.js';

import { reactComponentsImportsProvider } from '../react-components/index.js';
import { CORE_REACT_NOT_FOUND_HANDLER_GENERATED } from './generated/index.js';

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
    paths: CORE_REACT_NOT_FOUND_HANDLER_GENERATED.paths.task,
    main: createGeneratorTask({
      dependencies: {
        reactRoutes: reactRoutesProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        typescriptFile: typescriptFileProvider,
        paths: CORE_REACT_NOT_FOUND_HANDLER_GENERATED.paths.provider,
      },
      exports: {
        reactNotFound: reactNotFoundProvider.export(projectScope),
      },
      run({ reactRoutes, reactComponentsImports, typescriptFile, paths }) {
        const notFoundRoute = {
          path: '*',
          element: tsCodeFragment(
            `<NotFoundPage />`,
            tsImportBuilder().default('NotFoundPage').from(paths.notFoundPage),
          ),
        };

        reactRoutes.registerRoute({
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
                  CORE_REACT_NOT_FOUND_HANDLER_GENERATED.templates.notFoundPage,
                destination: paths.notFoundPage,
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
