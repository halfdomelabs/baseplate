import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { generatedGraphqlImportsProvider } from '#src/generators/apollo/react-apollo/providers/generated-graphql.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactConfigImportsProvider } from '#src/generators/core/react-config/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

import { ADMIN_ADMIN_BULL_BOARD_PATHS } from './template-paths.js';
import { ADMIN_ADMIN_BULL_BOARD_TEMPLATES } from './typed-templates.js';

export interface AdminAdminBullBoardRenderers {
  bullBoardPage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_BULL_BOARD_TEMPLATES.bullBoardPage
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const adminAdminBullBoardRenderers =
  createProviderType<AdminAdminBullBoardRenderers>(
    'admin-admin-bull-board-renderers',
  );

const adminAdminBullBoardRenderersTask = createGeneratorTask({
  dependencies: {
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: ADMIN_ADMIN_BULL_BOARD_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactConfigImports: reactConfigImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    adminAdminBullBoardRenderers: adminAdminBullBoardRenderers.export(),
  },
  run({
    generatedGraphqlImports,
    paths,
    reactComponentsImports,
    reactConfigImports,
    reactErrorImports,
    typescriptFile,
  }) {
    return {
      providers: {
        adminAdminBullBoardRenderers: {
          bullBoardPage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_BULL_BOARD_TEMPLATES.bullBoardPage,
                destination: paths.bullBoardPage,
                importMapProviders: {
                  generatedGraphqlImports,
                  reactComponentsImports,
                  reactConfigImports,
                  reactErrorImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const ADMIN_ADMIN_BULL_BOARD_RENDERERS = {
  provider: adminAdminBullBoardRenderers,
  task: adminAdminBullBoardRenderersTask,
};
