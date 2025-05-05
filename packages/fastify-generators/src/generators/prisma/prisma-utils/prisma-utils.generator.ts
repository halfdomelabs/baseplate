import {
  projectScope,
  tsUtilsImportsProvider,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import { createGenerator, createGeneratorTask } from '@halfdomelabs/sync';
import { z } from 'zod';

import { serviceContextImportsProvider } from '@src/generators/core/service-context/service-context.generator.js';

import { prismaImportsProvider } from '../prisma/prisma.generator.js';
import {
  createPrismaUtilsImports,
  prismaUtilsImportsProvider,
} from './generated/ts-import-maps.js';
import { PRISMA_PRISMA_UTILS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export const prismaUtilsGenerator = createGenerator({
  name: 'prisma/prisma-utils',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    imports: createGeneratorTask({
      exports: {
        prismaUtilsImports: prismaUtilsImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            prismaUtilsImports: createPrismaUtilsImports('@/src/utils'),
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        serviceContextImports: serviceContextImportsProvider,
        tsUtilsImports: tsUtilsImportsProvider,
        prismaImports: prismaImportsProvider,
      },
      run({
        typescriptFile,
        serviceContextImports,
        tsUtilsImports,
        prismaImports,
      }) {
        return {
          build: (builder) => {
            typescriptFile.addLazyTemplateGroup({
              group: PRISMA_PRISMA_UTILS_TS_TEMPLATES.utilsGroup,
              baseDirectory: '@/src/utils',
              generatorInfo: builder.generatorInfo,
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

export { prismaUtilsImportsProvider } from './generated/ts-import-maps.js';
export type { PrismaUtilsImportsProvider } from './generated/ts-import-maps.js';
