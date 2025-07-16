import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

import { ADMIN_ADMIN_COMPONENTS_PATHS } from './template-paths.js';
import { ADMIN_ADMIN_COMPONENTS_TEMPLATES } from './typed-templates.js';

export interface AdminAdminComponentsRenderers {
  componentsGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof ADMIN_ADMIN_COMPONENTS_TEMPLATES.componentsGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const adminAdminComponentsRenderers =
  createProviderType<AdminAdminComponentsRenderers>(
    'admin-admin-components-renderers',
  );

const adminAdminComponentsRenderersTask = createGeneratorTask({
  dependencies: {
    paths: ADMIN_ADMIN_COMPONENTS_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    adminAdminComponentsRenderers: adminAdminComponentsRenderers.export(),
  },
  run({ paths, reactComponentsImports, typescriptFile }) {
    return {
      providers: {
        adminAdminComponentsRenderers: {
          componentsGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: ADMIN_ADMIN_COMPONENTS_TEMPLATES.componentsGroup,
                paths,
                importMapProviders: {
                  reactComponentsImports,
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

export const ADMIN_ADMIN_COMPONENTS_RENDERERS = {
  provider: adminAdminComponentsRenderers,
  task: adminAdminComponentsRenderersTask,
};
