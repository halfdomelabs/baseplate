import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authComponentsImportsProvider } from '#src/generators/auth/_providers/auth-components.js';
import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
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
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  adminRoute: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_LAYOUT_TEMPLATES.adminRoute
        >,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const adminAdminLayoutRenderers = createProviderType<AdminAdminLayoutRenderers>(
  'admin-admin-layout-renderers',
);

const adminAdminLayoutRenderersTask = createGeneratorTask({
  dependencies: {
    authComponentsImports: authComponentsImportsProvider,
    authHooksImports: authHooksImportsProvider,
    paths: ADMIN_ADMIN_LAYOUT_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { adminAdminLayoutRenderers: adminAdminLayoutRenderers.export() },
  run({
    authComponentsImports,
    authHooksImports,
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
                  authComponentsImports,
                },
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
