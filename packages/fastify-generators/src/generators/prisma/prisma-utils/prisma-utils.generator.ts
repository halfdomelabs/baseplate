import {
  tsUtilsImportsProvider,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { serviceContextImportsProvider } from '#src/generators/core/service-context/index.js';

import { prismaImportsProvider } from '../prisma/index.js';
import { PRISMA_PRISMA_UTILS_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const prismaUtilsGenerator = createGenerator({
  name: 'prisma/prisma-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: PRISMA_PRISMA_UTILS_GENERATED.paths.task,
    imports: PRISMA_PRISMA_UTILS_GENERATED.imports.task,
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        serviceContextImports: serviceContextImportsProvider,
        tsUtilsImports: tsUtilsImportsProvider,
        prismaImports: prismaImportsProvider,
        paths: PRISMA_PRISMA_UTILS_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        serviceContextImports,
        tsUtilsImports,
        prismaImports,
        paths,
      }) {
        return {
          build: (builder) => {
            typescriptFile.addLazyTemplateGroupV2({
              group: PRISMA_PRISMA_UTILS_GENERATED.templates.utilsGroup,
              generatorInfo: builder.generatorInfo,
              paths,
              importMapProviders: {
                serviceContextImports,
                tsUtilsImports,
                prismaImports,
              },
            });
          },
        };
      },
    }),
  }),
});
