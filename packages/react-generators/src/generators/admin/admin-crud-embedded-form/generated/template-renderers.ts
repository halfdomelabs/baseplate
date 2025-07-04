import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';
import { reactErrorImportsProvider } from '#src/generators/core/react-error/generated/ts-import-providers.js';

import { ADMIN_ADMIN_CRUD_EMBEDDED_FORM_TEMPLATES } from './typed-templates.js';

export interface AdminAdminCrudEmbeddedFormRenderers {
  embeddedForm: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof ADMIN_ADMIN_CRUD_EMBEDDED_FORM_TEMPLATES.embeddedForm
        >,
        'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const adminAdminCrudEmbeddedFormRenderers =
  createProviderType<AdminAdminCrudEmbeddedFormRenderers>(
    'admin-admin-crud-embedded-form-renderers',
  );

const adminAdminCrudEmbeddedFormRenderersTask = createGeneratorTask({
  dependencies: {
    reactComponentsImports: reactComponentsImportsProvider,
    reactErrorImports: reactErrorImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    adminAdminCrudEmbeddedFormRenderers:
      adminAdminCrudEmbeddedFormRenderers.export(),
  },
  run({ reactComponentsImports, reactErrorImports, typescriptFile }) {
    return {
      providers: {
        adminAdminCrudEmbeddedFormRenderers: {
          embeddedForm: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_CRUD_EMBEDDED_FORM_TEMPLATES.embeddedForm,
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

export const ADMIN_ADMIN_CRUD_EMBEDDED_FORM_RENDERERS = {
  provider: adminAdminCrudEmbeddedFormRenderers,
  task: adminAdminCrudEmbeddedFormRenderersTask,
};
