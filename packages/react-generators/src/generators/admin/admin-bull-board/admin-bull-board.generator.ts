import {
  renderTextTemplateFileAction,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { quot } from '@baseplate-dev/utils';
import { z } from 'zod';

import {
  generatedGraphqlImportsProvider,
  reactApolloProvider,
} from '#src/generators/apollo/react-apollo/index.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/index.js';
import {
  reactConfigImportsProvider,
  reactConfigProvider,
} from '#src/generators/core/react-config/index.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/index.js';
import { reactRoutesProvider } from '#src/providers/index.js';

import { ADMIN_ADMIN_BULL_BOARD_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  bullBoardUrl: z.string().min(1),
});

export const adminBullBoardGenerator = createGenerator({
  name: 'admin/admin-bull-board',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ bullBoardUrl }) => ({
    paths: ADMIN_ADMIN_BULL_BOARD_GENERATED.paths.task,
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
        generatedGraphqlImports: generatedGraphqlImportsProvider,
        paths: ADMIN_ADMIN_BULL_BOARD_GENERATED.paths.provider,
        reactRoutes: reactRoutesProvider,
      },
      run({
        typescriptFile,
        reactComponentsImports,
        reactConfigImports,
        reactErrorImports,
        reactApollo,
        generatedGraphqlImports,
        paths,
        reactRoutes,
      }) {
        const routeFilePath = reactRoutes.getRouteFilePath();
        return {
          build: async (builder) => {
            reactApollo.registerGqlFile(paths.bullBoard);

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  ADMIN_ADMIN_BULL_BOARD_GENERATED.templates.bullBoardPage,
                destination: paths.bullBoardPage,
                variables: {
                  TPL_ROUTE_PATH: quot(`${routeFilePath}/bull-board/`),
                },
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
                template: ADMIN_ADMIN_BULL_BOARD_GENERATED.templates.bullBoard,
                destination: paths.bullBoard,
              }),
            );
          },
        };
      },
    }),
  }),
});
