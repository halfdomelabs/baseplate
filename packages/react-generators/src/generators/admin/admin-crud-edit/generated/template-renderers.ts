import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

import { ADMIN_ADMIN_CRUD_EDIT_TEMPLATES } from './typed-templates.js';

export interface AdminAdminCrudEditRenderers {
  createPage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.createPage
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  editForm: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.editForm
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  editPage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.editPage
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  schema: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.schema
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const adminAdminCrudEditRenderers =
  createProviderType<AdminAdminCrudEditRenderers>(
    'admin-admin-crud-edit-renderers',
  );

const adminAdminCrudEditRenderersTask = createGeneratorTask({
  dependencies: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    adminAdminCrudEditRenderers: adminAdminCrudEditRenderers.export(),
  },
  run({ reactComponentsImports, reactErrorImports, typescriptFile }) {
    return {
      providers: {
        adminAdminCrudEditRenderers: {
          createPage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.createPage,
                importMapProviders: {
                  reactErrorImports,
                },
                ...options,
              }),
          },
          editForm: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.editForm,
                importMapProviders: {
                  reactComponentsImports,
                  reactErrorImports,
                },
                ...options,
              }),
          },
          editPage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.editPage,
                ...options,
              }),
          },
          schema: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_CRUD_EDIT_TEMPLATES.schema,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const ADMIN_ADMIN_CRUD_EDIT_RENDERERS = {
  provider: adminAdminCrudEditRenderers,
  task: adminAdminCrudEditRenderersTask,
};
