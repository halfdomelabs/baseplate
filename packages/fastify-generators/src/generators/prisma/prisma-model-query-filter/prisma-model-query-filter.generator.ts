import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  packageScope,
  TsCodeUtils,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { lowercaseFirstChar } from '@baseplate-dev/utils';
import { posixJoin } from '@baseplate-dev/utils/node';
import { kebabCase } from 'change-case';
import { z } from 'zod';

import { appModuleProvider } from '#src/generators/core/app-module/index.js';

import { prismaQueryFilterUtilsImportsProvider } from '../prisma-query-filter-utils/index.js';

const roleSchema = z.object({
  /** camelCase role name (e.g., 'owner') */
  name: z.string().min(1),
  /** Pre-generated role function code (e.g., '(ctx) => ({ ownerId: ctx.auth.userId })') */
  roleCode: z.string().min(1),
});

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  roles: z.array(roleSchema).min(1),
});

/**
 * Provider interface for the model query filter.
 * Allows other generators (e.g., GraphQL query resolvers) to reference
 * the query filter and build where clauses.
 */
export interface PrismaModelQueryFilterProvider {
  /**
   * Get the variable name of the query filter (e.g., 'todoListQueryFilter').
   */
  getQueryFilterName(): string;
  /**
   * Get a fragment that imports the query filter from its module path.
   */
  getQueryFilterFragment(): TsCodeFragment;
}

export const prismaModelQueryFilterProvider =
  createReadOnlyProviderType<PrismaModelQueryFilterProvider>(
    'prisma-model-query-filter',
  );

// ----- Generator -----

/**
 * Generator for prisma/prisma-model-query-filter
 *
 * Generates `{moduleFolder}/authorizers/{kebab-model}.query-filter.ts` files
 * that create a model query filter with role functions returning where clauses.
 */
export const prismaModelQueryFilterGenerator = createGenerator({
  name: 'prisma/prisma-model-query-filter',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => `${descriptor.modelName}QueryFilter`,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        prismaQueryFilterUtilsImports: prismaQueryFilterUtilsImportsProvider,
      },
      outputs: {
        prismaModelQueryFilter: prismaModelQueryFilterProvider.export(
          packageScope,
          descriptor.modelName,
        ),
      },
      run({ appModule, typescriptFile, prismaQueryFilterUtilsImports }) {
        const { modelName, roles } = descriptor;
        const modelVarName = lowercaseFirstChar(modelName);
        const queryFilterName = `${modelVarName}QueryFilter`;

        const authorizerFolder = posixJoin(
          appModule.getModuleFolder(),
          'authorizers',
        );
        const queryFilterPath = posixJoin(
          authorizerFolder,
          `${kebabCase(modelName)}.query-filter.ts`,
        );

        return {
          build: async (builder) => {
            const rolesObject: Record<string, string> = {};

            for (const role of roles) {
              rolesObject[role.name] = role.roleCode;
            }

            const rolesFragment = TsCodeUtils.mergeFragmentsAsObject(
              rolesObject,
              { disableSort: true },
            );

            const fileFragment = tsTemplate`
              export const ${queryFilterName} = ${prismaQueryFilterUtilsImports.createModelQueryFilter.fragment()}({
                model: '${modelVarName}',
                roles: ${rolesFragment},
              });
            `;

            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id: `prisma-model-query-filter:${modelName}`,
                destination: queryFilterPath,
                fragment: fileFragment,
              }),
            );

            return {
              prismaModelQueryFilter: {
                getQueryFilterName() {
                  return queryFilterName;
                },
                getQueryFilterFragment() {
                  return TsCodeUtils.importFragment(
                    queryFilterName,
                    queryFilterPath,
                  );
                },
              },
            };
          },
        };
      },
    }),
  }),
});
