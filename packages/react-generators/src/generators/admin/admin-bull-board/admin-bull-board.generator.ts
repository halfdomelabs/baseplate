import {
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

import { reactApolloProvider } from '@src/generators/apollo/react-apollo/index.js';
import { reactComponentsProvider } from '@src/generators/core/react-components/index.js';
import { reactConfigProvider } from '@src/generators/core/react-config/index.js';
import { reactErrorProvider } from '@src/generators/core/react-error/index.js';
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
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        reactComponents: reactComponentsProvider,
        reactConfig: reactConfigProvider,
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
        reactConfig,
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
            const importMappers = [
              reactComponents,
              reactConfig,
              reactError,
              reactApollo,
            ];

            reactApollo.registerGqlFile(`${baseDirectory}/bull-board.gql`);

            reactRoutes.registerRoute({
              path: 'bull-board',
              element: TypescriptCodeUtils.createExpression(
                '<BullBoardPage />',
                `import BullBoardPage from '@/${baseDirectory}'`,
              ),
            });

            reactConfig.getConfigMap().set('VITE_BULL_BOARD_BASE', {
              comment: 'Base path for bull-board site',
              validator:
                TypescriptCodeUtils.createExpression('z.string().min(1)'),
              devValue: bullBoardUrl,
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
