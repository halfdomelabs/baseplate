import {
  tsCodeFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  renderTextTemplateFileAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import {
  generatedGraphqlImportsProvider,
  reactApolloProvider,
} from '@src/generators/apollo/react-apollo/react-apollo.generator.js';
import { reactComponentsImportsProvider } from '@src/generators/core/react-components/react-components.generator.js';
import {
  reactConfigImportsProvider,
  reactConfigProvider,
} from '@src/generators/core/react-config/react-config.generator.js';
import { reactErrorImportsProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { reactRoutesProvider } from '@src/providers/routes.js';

import { ADMIN_ADMIN_BULL_BOARD_TEXT_TEMPLATES } from './generated/text-templates.js';
import { ADMIN_ADMIN_BULL_BOARD_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({
  bullBoardUrl: z.string().min(1),
});

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
        typescriptFile: typescriptFileProvider,
        reactComponentsImports: reactComponentsImportsProvider,
        reactConfigImports: reactConfigImportsProvider,
        reactErrorImports: reactErrorImportsProvider,
        reactApollo: reactApolloProvider,
        reactRoutes: reactRoutesProvider,
        generatedGraphqlImports: generatedGraphqlImportsProvider,
      },
      run({
        typescriptFile,
        reactComponentsImports,
        reactConfigImports,
        reactErrorImports,
        reactApollo,
        reactRoutes,
        generatedGraphqlImports,
      }) {
        const baseDirectory = `${reactRoutes.getDirectoryBase()}/bull-board`;
        const bullBoardPagePath = `${baseDirectory}/index.tsx`;
        const bullBoardGqlPath = `${baseDirectory}/bull-board.gql`;

        return {
          build: async (builder) => {
            reactApollo.registerGqlFile(`${baseDirectory}/bull-board.gql`);

            reactRoutes.registerRoute({
              path: 'bull-board',
              element: tsCodeFragment(
                '<BullBoardPage />',
                tsImportBuilder()
                  .default('BullBoardPage')
                  .from(bullBoardPagePath),
              ),
            });

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_BULL_BOARD_TS_TEMPLATES.bullBoardPage,
                destination: bullBoardPagePath,
                variables: {},
                importMapProviders: {
                  reactComponentsImports,
                  reactConfigImports,
                  reactErrorImports,
                  generatedGraphqlImports,
                },
              }),
            );

            await builder.apply(
              renderTextTemplateFileAction({
                template: ADMIN_ADMIN_BULL_BOARD_TEXT_TEMPLATES.bullBoard,
                destination: bullBoardGqlPath,
              }),
            );
          },
        };
      },
    }),
  }),
});
