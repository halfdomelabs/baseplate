import type { RenderTsTemplateFileActionInput } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { typescriptFileProvider } from '@baseplate-dev/core-generators';
import { createGeneratorTask, createProviderType } from '@baseplate-dev/sync';

import { prismaImportsProvider } from '#src/generators/prisma/prisma/generated/ts-import-providers.js';

import { VITEST_PRISMA_VITEST_PATHS } from './template-paths.js';
import { VITEST_PRISMA_VITEST_TEMPLATES } from './typed-templates.js';

export interface VitestPrismaVitestRenderers {
  dbTestHelper: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof VITEST_PRISMA_VITEST_TEMPLATES.dbTestHelper
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
  prismaTestHelper: {
    render: (
      options: Omit<
        RenderTsTemplateFileActionInput<
          typeof VITEST_PRISMA_VITEST_TEMPLATES.prismaTestHelper
        >,
        'destination' | 'importMapProviders' | 'template' | 'generatorPaths'
      >,
    ) => BuilderAction;
  };
}

const vitestPrismaVitestRenderers =
  createProviderType<VitestPrismaVitestRenderers>(
    'vitest-prisma-vitest-renderers',
  );

const vitestPrismaVitestRenderersTask = createGeneratorTask({
  dependencies: {
    paths: VITEST_PRISMA_VITEST_PATHS.provider,
    prismaImports: prismaImportsProvider,
    typescriptFile: typescriptFileProvider,
  },
  exports: {
    vitestPrismaVitestRenderers: vitestPrismaVitestRenderers.export(),
  },
  run({ paths, prismaImports, typescriptFile }) {
    return {
      providers: {
        vitestPrismaVitestRenderers: {
          dbTestHelper: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: VITEST_PRISMA_VITEST_TEMPLATES.dbTestHelper,
                destination: paths.dbTestHelper,
                ...options,
              }),
          },
          prismaTestHelper: {
            render: (options) =>
              typescriptFile.renderTemplateFile({
                template: VITEST_PRISMA_VITEST_TEMPLATES.prismaTestHelper,
                destination: paths.prismaTestHelper,
                importMapProviders: {
                  prismaImports,
                },
                ...options,
              }),
          },
        },
      },
    };
  },
});

export const VITEST_PRISMA_VITEST_RENDERERS = {
  provider: vitestPrismaVitestRenderers,
  task: vitestPrismaVitestRenderersTask,
};
