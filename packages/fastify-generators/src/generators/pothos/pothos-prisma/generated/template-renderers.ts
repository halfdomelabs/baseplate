import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { POTHOS_POTHOS_PRISMA_PATHS } from './template-paths.js';
import { POTHOS_POTHOS_PRISMA_TEMPLATES } from './typed-templates.js';

export interface PothosPothosPrismaRenderers {
  pothosPrismaTypes: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof POTHOS_POTHOS_PRISMA_TEMPLATES.pothosPrismaTypes
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const pothosPothosPrismaRenderers =
  createProviderType<PothosPothosPrismaRenderers>(
    'pothos-pothos-prisma-renderers',
  );

const pothosPothosPrismaRenderersTask = createGeneratorTask({
  dependencies: {
    paths: POTHOS_POTHOS_PRISMA_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    pothosPothosPrismaRenderers: pothosPothosPrismaRenderers.export(),
  },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        pothosPothosPrismaRenderers: {
          pothosPrismaTypes: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: POTHOS_POTHOS_PRISMA_TEMPLATES.pothosPrismaTypes,
                destination: paths.pothosPrismaTypes,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const POTHOS_POTHOS_PRISMA_RENDERERS = {
  provider: pothosPothosPrismaRenderers,
  task: pothosPothosPrismaRenderersTask,
};
