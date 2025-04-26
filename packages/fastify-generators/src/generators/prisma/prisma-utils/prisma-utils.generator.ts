import type { ImportMapper } from '@halfdomelabs/core-generators';
import type { TemplateFileSource } from '@halfdomelabs/sync';

import {
  projectScope,
  tsUtilsImportsProvider,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import path from 'node:path/posix';
import { z } from 'zod';

import { serviceContextImportsProvider } from '@src/generators/core/service-context/service-context.generator.js';

import { prismaImportsProvider } from '../prisma/prisma.generator.js';
import {
  createPrismaUtilsImports,
  prismaUtilsImportsProvider,
} from './generated/ts-import-maps.js';
import { PRISMA_PRISMA_UTILS_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

export type PrismaUtilsProvider = ImportMapper;

export const prismaUtilsProvider =
  createProviderType<PrismaUtilsProvider>('prisma-utils');

function getUtilsPath(source: TemplateFileSource): string {
  if (!('path' in source)) {
    throw new Error('Template path is required');
  }
  return path.join('@/src/utils', source.path);
}

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
      exports: {
        prismaUtils: prismaUtilsProvider.export(projectScope),
      },
      run({
        typescriptFile,
        serviceContextImports,
        tsUtilsImports,
        prismaImports,
      }) {
        const files = Object.entries(
          PRISMA_PRISMA_UTILS_TS_TEMPLATES.utilsGroup.templates,
        ).map(([key, template]) => ({
          key,
          template,
        }));

        const importMap = Object.fromEntries(
          files.map(({ key, template }) => [
            `%prisma-utils/${key}`,
            {
              path: getUtilsPath(template.template.source),
              allowedImports: Object.keys(
                template.template.projectExports ?? {},
              ),
              onImportUsed: () => {
                const canonicalPath = getUtilsPath(template.template.source);
                typescriptFile.markImportAsUsed(canonicalPath.slice(2));
              },
            },
          ]),
        );

        return {
          providers: {
            prismaUtils: {
              getImportMap: () => importMap,
            },
          },
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

export type { PrismaUtilsImportsProvider } from './generated/ts-import-maps.js';
export { prismaUtilsImportsProvider } from './generated/ts-import-maps.js';
