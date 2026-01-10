import type { RenderTsTemplateGroupActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { EMAIL_TRANSACTIONAL_LIB_PATHS } from './template-paths.js';
import { EMAIL_TRANSACTIONAL_LIB_TEMPLATES } from './typed-templates.js';

export interface EmailTransactionalLibRenderers {
  mainGroup: {
    render: (
      options: Omit<
        RenderTsTemplateGroupActionInput<
          typeof EMAIL_TRANSACTIONAL_LIB_TEMPLATES.mainGroup
        >,
        'importMapProviders' | 'group' | 'paths' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const emailTransactionalLibRenderers =
  createProviderType<EmailTransactionalLibRenderers>(
    'email-transactional-lib-renderers',
  );

const emailTransactionalLibRenderersTask = createGeneratorTask({
  dependencies: {
    paths: EMAIL_TRANSACTIONAL_LIB_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    emailTransactionalLibRenderers: emailTransactionalLibRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        emailTransactionalLibRenderers: {
          mainGroup: {
            render: (options) =>
              typescriptFile.renderTemplateGroup({
                group: EMAIL_TRANSACTIONAL_LIB_TEMPLATES.mainGroup,
                paths,
                generatorPaths: paths,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const EMAIL_TRANSACTIONAL_LIB_RENDERERS = {
  provider: emailTransactionalLibRenderers,
  task: emailTransactionalLibRenderersTask,
};
