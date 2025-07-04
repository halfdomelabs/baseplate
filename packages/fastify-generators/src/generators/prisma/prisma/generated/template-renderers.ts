import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { PRISMA_PRISMA_PATHS } from './template-paths.js';
import { PRISMA_PRISMA_TEMPLATES } from './typed-templates.js';

export interface PrismaPrismaRenderers {
  seed: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof PRISMA_PRISMA_TEMPLATES.seed>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
  service: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<typeof PRISMA_PRISMA_TEMPLATES.service>,
        'destination' | 'importMapProviders' | 'template'
      >,
    ) => BuilderAction;
  };
}

const prismaPrismaRenderers = createProviderType<PrismaPrismaRenderers>(
  'prisma-prisma-renderers',
);

const prismaPrismaRenderersTask = createGeneratorTask({
  dependencies: {
    paths: PRISMA_PRISMA_PATHS.provider,
    typescriptFile: typescriptFileProvider,
  },
  exports: { prismaPrismaRenderers: prismaPrismaRenderers.export() },
  run({ paths, typescriptFile }) {
    return {
      providers: {
        prismaPrismaRenderers: {
          seed: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_PRISMA_TEMPLATES.seed,
                destination: paths.seed,
                ...options,
              }),
          },
          service: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: PRISMA_PRISMA_TEMPLATES.service,
                destination: paths.service,
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const PRISMA_PRISMA_RENDERERS = {
  provider: prismaPrismaRenderers,
  task: prismaPrismaRenderersTask,
};
