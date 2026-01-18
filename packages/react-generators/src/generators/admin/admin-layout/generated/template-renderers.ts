import type {
  RenderTsTemplateFileActionInput,
  RenderTsTemplateGroupActionInput,
} from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { authErrorsImportsProvider } from '#src/generators/auth/auth-errors/generated/ts-import-providers.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorBoundaryImportsProvider } from '#src/generators/core/react-error-boundary/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

import { ADMIN_ADMIN_LAYOUT_PATHS } from './template-paths.js';
import { ADMIN_ADMIN_LAYOUT_TEMPLATES } from './typed-templates.js';

export interface AdminAdminLayoutRenderers {
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
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof ADMIN_ADMIN_LAYOUT_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
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
    paths: ADMIN_ADMIN_LAYOUT_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorBoundaryImports: reactErrorBoundaryImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { adminAdminLayoutRenderers: adminAdminLayoutRenderers.export() },
  run({
    authErrorsImports,
    authHooksImports,
    paths,
    reactComponentsImports,
    reactErrorBoundaryImports,
    reactErrorImports,
    typescriptFile,
  }) {
    return {
      providers: {
        adminAdminLayoutRenderers: {
          adminRoute: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_LAYOUT_TEMPLATES.adminRoute,
                destination: paths.adminRoute,
                importMapProviders: {
                  authErrorsImports,
                  authHooksImports,
                },
                generatorPaths: paths,
                ...options,
              }),
          },
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: ADMIN_ADMIN_LAYOUT_TEMPLATES.mainGroup,
                paths,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                  reactErrorBoundaryImports,
                  reactErrorImports,
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
