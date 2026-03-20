import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { loggerServiceImportsProvider } from '@baseplate-dev/fastify-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { emailModuleImportsProvider } from '#src/email/core/generators/email-module/generated/ts-import-providers.js';

import { STUB_CORE_STUB_PATHS } from './template-paths.js';
import { STUB_CORE_STUB_TEMPLATES } from './typed-templates.js';

export interface StubCoreStubRenderers {
  stubService: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof STUB_CORE_STUB_TEMPLATES.stubService
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const stubCoreStubRenderers = createProviderType<StubCoreStubRenderers>(
  'stub-core-stub-renderers',
);

const stubCoreStubRenderersTask = createGeneratorTask({
  dependencies: {
    emailModuleImports: emailModuleImportsProvider,
    loggerServiceImports: loggerServiceImportsProvider,
    paths: STUB_CORE_STUB_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { stubCoreStubRenderers: stubCoreStubRenderers.export() },
  run({ emailModuleImports, loggerServiceImports, paths, typescriptFile }) {
    return {
      providers: {
        stubCoreStubRenderers: {
          stubService: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: STUB_CORE_STUB_TEMPLATES.stubService,
                destination: paths.stubService,
                importMapProviders: {
                  emailModuleImports,
                  loggerServiceImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const STUB_CORE_STUB_RENDERERS = {
  provider: stubCoreStubRenderers,
  task: stubCoreStubRenderersTask,
};
