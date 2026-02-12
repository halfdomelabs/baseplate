import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import { appModuleProvider } from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { CASE_VALIDATORS, quot } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { camelCase } from 'es-toolkit';
import { z } from 'zod';

import {
  storageModuleConfigProvider,
  storageModuleImportsProvider,
} from '#src/generators/index.js';

const descriptorSchema = z.object({
  featureId: z.string(),
  fileCategories: z.array(
    z.object({
      name: CASE_VALIDATORS.CONSTANT_CASE,
      maxFileSizeMb: z.int().positive(),
      adapter: z.string(),
      authorize: z.object({
        uploadRoles: z.array(z.string()),
      }),
      referencedByRelation: z.string(),
    }),
  ),
});

export interface FileCategoriesProvider {
  getFileCategoryImportFragment(name: string): TsCodeFragment;
}

export const fileCategoriesProvider =
  createProviderType<FileCategoriesProvider>('storage-file-categories');

function getFileCategoryExportName(name: string): string {
  return `${camelCase(name)}FileCategory`;
}

/**
 * Generator for a set of file categories (tied to a feature).
 */
export const fileCategoriesGenerator = createGenerator({
  name: 'storage/core/file-categories',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ featureId, fileCategories }) => ({
    main: createGeneratorTask({
      dependencies: {
        storageModuleImports: storageModuleImportsProvider,
        typescriptFile: typescriptFileProvider,
        appModule: appModuleProvider,
        storageModuleConfig: storageModuleConfigProvider,
      },
      exports: {
        fileCategories: fileCategoriesProvider.export(packageScope, featureId),
      },
      run({
        storageModuleImports,
        typescriptFile,
        appModule,
        storageModuleConfig,
      }) {
        const fileCategoryPath = posixJoin(
          appModule.getModuleFolder(),
          'constants',
          'file-categories.ts',
        );
        function getFileCategoryImportFragment(name: string): TsCodeFragment {
          if (!fileCategories.some((c) => c.name === name)) {
            throw new Error(`File category ${name} not found`);
          }
          return TsCodeUtils.importFragment(
            getFileCategoryExportName(name),
            fileCategoryPath,
          );
        }
        return {
          providers: {
            fileCategories: {
              getFileCategoryImportFragment,
            },
          },
          build: async (builder) => {
            const fileCategoryFragments = new Map<string, TsCodeFragment>();
            for (const category of fileCategories) {
              storageModuleConfig.fileCategories.set(
                category.name,
                getFileCategoryImportFragment(category.name),
              );
              fileCategoryFragments.set(
                category.name,
                tsTemplate`
              export const ${getFileCategoryExportName(category.name)} = ${storageModuleImports.createFileCategory.fragment()}(${TsCodeUtils.mergeFragmentsAsObject(
                {
                  name: quot(category.name),
                  maxFileSize: tsTemplate`${storageModuleImports.FileSize.fragment()}.MB(${category.maxFileSizeMb.toString()})`,
                  authorize:
                    category.authorize.uploadRoles.length > 0
                      ? tsTemplate`{
                        upload: ({ auth }) => auth.hasSomeRole(${TsCodeUtils.mergeFragmentsAsArrayPresorted(
                          category.authorize.uploadRoles.map(quot).toSorted(),
                        )})
                      }`
                      : undefined,
                  adapter: quot(category.adapter),
                  referencedByRelation: quot(category.referencedByRelation),
                },
              )})`,
              );
            }

            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id: `file-categories-${featureId}`,
                fragment: TsCodeUtils.mergeFragments(fileCategoryFragments),
                destination: fileCategoryPath,
              }),
            );
          },
        };
      },
    }),
  }),
});
