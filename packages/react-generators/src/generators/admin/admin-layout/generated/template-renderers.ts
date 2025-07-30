import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { generatedGraphqlImportsProvider } from '#src/generators/apollo/react-apollo/providers/generated-graphql.js';
import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { authErrorsImportsProvider } from '#src/generators/auth/auth-errors/generated/ts-import-providers.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

import { ADMIN_ADMIN_LAYOUT_PATHS } from './template-paths.js';
import { ADMIN_ADMIN_LAYOUT_TEMPLATES } from './typed-templates.js';

export interface AdminAdminLayoutRenderers {
  adminLayout: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_LAYOUT_TEMPLATES.adminLayout
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  adminRoute: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_LAYOUT_TEMPLATES.adminRoute
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const adminAdminLayoutRenderers = createProviderType<AdminAdminLayoutRenderers>(
  'admin-admin-layout-renderers',
);

const adminAdminLayoutRenderersTask = createGeneratorTask({
  dependencies: {
    authErrorsImports: authErrorsImportsProvider,
    authHooksImports: authHooksImportsProvider,
    generatedGraphqlImports: generatedGraphqlImportsProvider,
    paths: ADMIN_ADMIN_LAYOUT_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { adminAdminLayoutRenderers: adminAdminLayoutRenderers.export() },
  run({
    authErrorsImports,
    authHooksImports,
    generatedGraphqlImports,
    paths,
    reactComponentsImports,
    typescriptFile,
  }) {
    return {
      providers: {
        adminAdminLayoutRenderers: {
          adminLayout: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_LAYOUT_TEMPLATES.adminLayout,
                destination: paths.adminLayout,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                },
                ...options,
              }),
          },
          adminRoute: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_LAYOUT_TEMPLATES.adminRoute,
                destination: paths.adminRoute,
                importMapProviders: {
                  authErrorsImports,
                  generatedGraphqlImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const ADMIN_ADMIN_LAYOUT_RENDERERS = {
  provider: adminAdminLayoutRenderers,
  task: adminAdminLayoutRenderersTask,
};
