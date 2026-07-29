import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type { PrismaModelPolicyProvider } from '@baseplate-dev/fastify-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  appModuleProvider,
  errorHandlerServiceImportsProvider,
  prismaModelPolicyProvider,
  prismaOutputProvider,
} from '@baseplate-dev/fastify-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@baseplate-dev/sync';
import { CASE_VALIDATORS, compareStrings, quot } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { camelCase } from 'es-toolkit';
import { z } from 'zod';

import {
  storageModuleConfigProvider,
  storageModuleImportsProvider,
} from '#src/generators/index.js';

import {
  buildAuthorizeFragment,
  referencedBySchema,
} from './build-presigned-read.js';

const descriptorSchema = z.object({
  featureId: z.string(),
  fileCategories: z.array(
    z.object({
      name: CASE_VALIDATORS.CONSTANT_CASE,
      maxFileSizeMb: z.int().positive(),
      allowedMimeTypes: z.array(z.string()).optional(),
      adapter: z.string(),
      authorize: z.object({
        uploadRoles: z.array(z.string()),
      }),
      referencedBy: z.array(referencedBySchema),
      disableAutoCleanup: z.boolean().optional(),
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
  buildTasks: ({ featureId, fileCategories }) => {
    // Optional references: a policy exists only for models with authorizer
    // roles, so an unpoliced model simply yields no read rule.
    const referencedModelNames = [
      ...new Set(
        fileCategories.flatMap((c) => c.referencedBy.map((r) => r.modelName)),
      ),
    ].toSorted(compareStrings);

    const modelPolicyDeps = Object.fromEntries(
      referencedModelNames.map((name) => [
        `modelPolicy_${name}`,
        prismaModelPolicyProvider.dependency().optionalReference(name),
      ]),
    );

    return {
      main: createGeneratorTask({
        dependencies: {
          storageModuleImports: storageModuleImportsProvider,
          typescriptFile: typescriptFileProvider,
          appModule: appModuleProvider,
          storageModuleConfig: storageModuleConfigProvider,
          prismaOutput: prismaOutputProvider,
          errorHandlerServiceImports: errorHandlerServiceImportsProvider,
          ...(modelPolicyDeps as Record<string, never>),
        },
        exports: {
          fileCategories: fileCategoriesProvider.export(
            packageScope,
            featureId,
          ),
        },
        run({
          storageModuleImports,
          typescriptFile,
          appModule,
          storageModuleConfig,
          prismaOutput,
          errorHandlerServiceImports,
          ...dynamicDependencies
        }) {
          const modelPolicies = dynamicDependencies as Record<
            string,
            PrismaModelPolicyProvider | undefined
          >;
          const presignedReadContext = {
            prismaOutput,
            getModelPolicy: (modelName: string) =>
              modelPolicies[`modelPolicy_${modelName}`],
            forbiddenErrorFragment: () =>
              errorHandlerServiceImports.ForbiddenError.fragment(),
          };

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
                appModule.moduleFields.set(
                  'storageCategories',
                  category.name,
                  getFileCategoryImportFragment(category.name),
                );
                storageModuleConfig.fileCategoryNames.set(
                  category.name,
                  category.name,
                );
                fileCategoryFragments.set(
                  category.name,
                  tsTemplate`
              export const ${getFileCategoryExportName(category.name)} = ${storageModuleImports.createFileCategory.fragment()}(${TsCodeUtils.mergeFragmentsAsObject(
                {
                  name: quot(category.name),
                  maxFileSize: tsTemplate`${storageModuleImports.FileSize.fragment()}.MB(${category.maxFileSizeMb.toString()})`,
                  // Omitted when empty: an empty array is truthy and would
                  // reject every upload, whereas undefined allows all types.
                  allowedMimeTypes: category.allowedMimeTypes?.length
                    ? TsCodeUtils.mergeFragmentsAsArrayPresorted(
                        category.allowedMimeTypes.map(quot).toSorted(),
                      )
                    : undefined,
                  authorize: buildAuthorizeFragment(
                    category,
                    presignedReadContext,
                  ),
                  adapter: quot(category.adapter),
                  referencedByRelations:
                    category.referencedBy.length > 0
                      ? TsCodeUtils.mergeFragmentsAsArrayPresorted(
                          category.referencedBy
                            .map((r) => quot(r.relationName))
                            .toSorted(),
                        )
                      : undefined,
                  disableAutoCleanup: category.disableAutoCleanup
                    ? 'true'
                    : undefined,
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
    };
  },
});
