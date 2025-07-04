import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

import { ADMIN_ADMIN_CRUD_LIST_TEMPLATES } from './typed-templates.js';

export interface AdminAdminCrudListRenderers {
  listPage: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_CRUD_LIST_TEMPLATES.listPage
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  table: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_CRUD_LIST_TEMPLATES.table
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const adminAdminCrudListRenderers =
  createProviderType<AdminAdminCrudListRenderers>(
    'admin-admin-crud-list-renderers',
  );

const adminAdminCrudListRenderersTask = createGeneratorTask({
  dependencies: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    adminAdminCrudListRenderers: adminAdminCrudListRenderers.export(),
  },
  run({ reactComponentsImports, reactErrorImports, typescriptFile }) {
    return {
      providers: {
        adminAdminCrudListRenderers: {
          listPage: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_CRUD_LIST_TEMPLATES.listPage,
                importMapProviders: {
                  reactComponentsImports,
                },
                ...options,
              }),
          },
          table: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_CRUD_LIST_TEMPLATES.table,
                importMapProviders: {
                  reactComponentsImports,
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

export const ADMIN_ADMIN_CRUD_LIST_RENDERERS = {
  provider: adminAdminCrudListRenderers,
  task: adminAdminCrudListRenderersTask,
};
