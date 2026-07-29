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

/**
 * A model relation pointing at this category's files. `relationName` is the
 * File-side name (drives orphan cleanup); `modelName`/`fieldName` identify the
 * owning side, whose policy and field permissions gate reads.
 */
const referencedBySchema = z.object({
  relationName: z.string(),
  modelName: z.string(),
  fieldName: z.string(),
  fieldGlobalRoles: z.array(z.string()).default([]),
  fieldInstanceRoles: z.array(z.string()).default([]),
});

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

type ReferencedBy = z.infer<typeof referencedBySchema>;

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
          const getModelPolicy = (
            modelName: string,
          ): PrismaModelPolicyProvider | undefined =>
            modelPolicies[`modelPolicy_${modelName}`];

          /**
           * A read rule for one referencing relation: load the owning row under
           * that model's `read` grant, then apply the relation's own field
           * permissions. Returns undefined when the model has no policy.
           */
          function buildReferenceReadFragment(
            ref: ReferencedBy,
          ): TsCodeFragment | undefined {
            const modelPolicy = getModelPolicy(ref.modelName);
            if (!modelPolicy) return undefined;

            const isGated =
              ref.fieldGlobalRoles.length > 0 ||
              ref.fieldInstanceRoles.length > 0;

            // Without a field gate only existence matters, so narrow the row to
            // its id(s). A gate's instance checks receive the row, so it must be
            // loaded whole.
            const { idFields } = prismaOutput.getPrismaModel(ref.modelName);
            const selectFragment =
              !isGated && idFields?.length
                ? tsTemplate`
            select: ${TsCodeUtils.mergeFragmentsAsObject(
              Object.fromEntries(
                idFields.toSorted(compareStrings).map((f) => [f, 'true']),
              ),
            )},`
                : '';

            const rowFragment = tsTemplate`await ${prismaOutput.getPrismaModelFragment(
              ref.modelName,
            )}.findFirst({
            where: ${modelPolicy.getActionWhereFragment('read')}(context, {
              ${ref.fieldName}Id: file.id,
            }),${selectFragment}
          })`;

            if (!isGated) {
              return tsTemplate`((${rowFragment}) !== null)`;
            }

            // Mirrors the GraphQL field gate: global roles and instance checks
            // are OR-ed against each other, then AND-ed with reading the row.
            const gateFragments: TsCodeFragment[] = [
              ...(ref.fieldGlobalRoles.length > 0
                ? [
                    tsTemplate`context.auth.hasSomeRole(${TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      ref.fieldGlobalRoles.map(quot).toSorted(),
                    )})`,
                  ]
                : []),
              ...ref.fieldInstanceRoles
                .toSorted(compareStrings)
                .map(
                  (roleName) =>
                    tsTemplate`await ${modelPolicy.getRoleCheckFragment(roleName)}(context, row)`,
                ),
            ];

            return tsTemplate`(await (async () => {
            const row = ${rowFragment};
            if (!row) return false;
            return ${TsCodeUtils.mergeFragments(
              new Map(gateFragments.map((f, i) => [String(i), f])),
              ' || ',
            )};
          })())`;
          }

          /**
           * `presignedRead` for a category: readable if ANY referencing relation
           * grants it. Omitted entirely when nothing is derivable, which the
           * runtime treats as deny.
           */
          function buildPresignedReadFragment(
            referencedBy: ReferencedBy[],
          ): TsCodeFragment | undefined {
            const refFragments = referencedBy
              .toSorted((a, b) =>
                compareStrings(
                  `${a.modelName}.${a.fieldName}`,
                  `${b.modelName}.${b.fieldName}`,
                ),
              )
              .map((ref) => ({
                ref,
                fragment: buildReferenceReadFragment(ref),
              }))
              .filter(
                (
                  entry,
                ): entry is { ref: ReferencedBy; fragment: TsCodeFragment } =>
                  entry.fragment !== undefined,
              );

            if (refFragments.length === 0) return undefined;

            if (refFragments.length === 1) {
              return tsTemplate`async (file, context) =>
              ${refFragments[0].fragment}`;
            }

            // With several referencing models, a model that grants nothing throws
            // ForbiddenError from `.where`. Swallow only that — it means "this
            // model grants no access", not "the request fails" — so another
            // model's grant still applies.
            const guarded = refFragments.map(
              ({ fragment }) => tsTemplate`(await (async () => {
              try {
                return ${fragment};
              } catch (error) {
                if (error instanceof ${errorHandlerServiceImports.ForbiddenError.fragment()}) {
                  return false;
                }
                throw error;
              }
            })())`,
            );

            return tsTemplate`async (file, context) =>
            ${TsCodeUtils.mergeFragments(
              new Map(guarded.map((f, i) => [String(i), f])),
              ' || ',
            )}`;
          }

          /** The category's `authorize` object, omitted when it would be empty. */
          function buildAuthorizeFragment(category: {
            authorize: { uploadRoles: string[] };
            referencedBy: ReferencedBy[];
          }): TsCodeFragment | undefined {
            const members: Record<string, TsCodeFragment | undefined> = {
              upload:
                category.authorize.uploadRoles.length > 0
                  ? tsTemplate`({ auth }) => auth.hasSomeRole(${TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      category.authorize.uploadRoles.map(quot).toSorted(),
                    )})`
                  : undefined,
              presignedRead: buildPresignedReadFragment(category.referencedBy),
            };
            if (Object.values(members).every((m) => m === undefined)) {
              return undefined;
            }
            return TsCodeUtils.mergeFragmentsAsObject(members);
          }

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
                  authorize: buildAuthorizeFragment(category),
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
