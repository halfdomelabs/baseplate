import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { authHooksImportsProvider } from '#src/generators/auth/_providers/auth-hooks.js';
import { reactComponentsImportsProvider } from '#src/generators/core/react-components/generated/ts-import-providers.js';

import { ADMIN_ADMIN_HOME_PATHS } from './template-paths.js';
import { ADMIN_ADMIN_HOME_TEMPLATES } from './typed-templates.js';

export interface AdminAdminHomeRenderers {
  home: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof ADMIN_ADMIN_HOME_TEMPLATES.home>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const adminAdminHomeRenderers = createProviderType<AdminAdminHomeRenderers>(
  'admin-admin-home-renderers',
);

const adminAdminHomeRenderersTask = createGeneratorTask({
  dependencies: {
    authHooksImports: authHooksImportsProvider,
    paths: ADMIN_ADMIN_HOME_PATHS.provider,
    reactComponentsImports: reactComponentsImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { adminAdminHomeRenderers: adminAdminHomeRenderers.export() },
  run({ authHooksImports, paths, reactComponentsImports, typescriptFile }) {
    return {
      providers: {
        adminAdminHomeRenderers: {
          home: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: ADMIN_ADMIN_HOME_TEMPLATES.home,
                destination: paths.home,
                importMapProviders: {
                  authHooksImports,
                  reactComponentsImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const ADMIN_ADMIN_HOME_RENDERERS = {
  provider: adminAdminHomeRenderers,
  task: adminAdminHomeRenderersTask,
};
