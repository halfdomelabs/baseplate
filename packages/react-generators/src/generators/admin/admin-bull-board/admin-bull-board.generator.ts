import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactApolloProvider } from '@src/generators/apollo/react-apollo/react-apollo.generator.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/react-components.generator.js';
import {
  reactConfigImportsProvider,
  reactConfigProvider,
} from '@src/generators/core/react-config/react-config.generator.js';
import { reactErrorProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { reactRoutesProvider } from '@src/providers/routes.js';

const descriptorSchema = z.object({
  bullBoardUrl: z.string().min(1),
});

export type AdminBullBoardProvider = unknown;

export const adminBullBoardProvider =
  createProviderType<AdminBullBoardProvider>('admin-bull-board');

export const adminBullBoardGenerator = createGenerator({
  name: 'admin/admin-bull-board',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ bullBoardUrl }) => ({
    reactConfig: createProviderTask(reactConfigProvider, (reactConfig) => {
      reactConfig.configEntries.set('VITE_BULL_BOARD_BASE', {
        comment: 'Base path for bull-board site',
        validator: 'z.string().min(1)',
        devDefaultValue: bullBoardUrl,
      });
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        reactComponents: reactComponentsProvider,
        reactConfigImports: reactConfigImportsProvider,
        reactError: reactErrorProvider,
        reactApollo: reactApolloProvider,
        reactRoutes: reactRoutesProvider,
      },
      exports: {
        adminBullBoard: adminBullBoardProvider.export(projectScope),
      },
      run({
        typescript,
        reactComponents,
        reactConfigImports,
        reactError,
        reactApollo,
        reactRoutes,
      }) {
        const baseDirectory = `${reactRoutes.getDirectoryBase()}/bull-board`;

        return {
          providers: {
            adminBullBoard: {},
          },
          build: async (builder) => {
            const importMappers: ImportMapper[] = [
              reactComponents,
              {
                getImportMap: () => ({
                  '%react-config': {
                    path: reactConfigImports.config.moduleSpecifier,
                    allowedImports: ['config'],
                  },
                }),
              },
              reactError,
              reactApollo,
            ];

            reactApollo.registerGqlFile(`${baseDirectory}/bull-board.gql`);

            reactRoutes.registerRoute({
              path: 'bull-board',
              element: tsCodeFragment(
                '<BullBoardPage />',
                tsImportBuilder().default('BullBoardPage').from(baseDirectory),
              ),
            });

            await builder.apply(
              typescript.createCopyFilesAction({
                paths: ['index.tsx', 'bull-board.gql'],
                destinationBaseDirectory: baseDirectory,
                importMappers,
              }),
            );
          },
        };
      },
    }),
  }),
});
