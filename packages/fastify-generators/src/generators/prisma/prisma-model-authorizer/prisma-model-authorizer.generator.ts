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

import { prismaAuthorizerUtilsImportsProvider } from '../prisma-authorizer-utils/index.js';
import { prismaOutputProvider } from '../prisma/prisma.generator.js';

const roleSchema = z.object({
  /** camelCase role name (e.g., 'owner') */
  name: z.string().min(1),
  /** Pre-generated role function code (e.g., '(ctx, model) => model.id === ctx.auth.userId') */
  roleCode: z.string().min(1),
});

const descriptorSchema = z.object({
  modelName: z.string().min(1),
  idFieldName: z.string().min(1),
  roles: z.array(roleSchema).min(1),
});

/**
 * Provider interface for the model authorizer.
 * Allows other generators (e.g., GraphQL resolvers) to reference
 * the authorizer and its individual role check functions.
 */
export interface PrismaModelAuthorizerProvider {
  /**
   * Get the variable name of the authorizer (e.g., 'userAuthorizer').
   */
  getAuthorizerName(): string;
  /**
   * Get a fragment that imports the authorizer from its module path.
   */
  getAuthorizerFragment(): TsCodeFragment;
  /**
   * Get a fragment referencing a specific role check function.
   * E.g., `userAuthorizer.roles.owner`
   */
  getRoleFragment(roleName: string): TsCodeFragment;
}

export const prismaModelAuthorizerProvider =
  createReadOnlyProviderType<PrismaModelAuthorizerProvider>(
    'prisma-model-authorizer',
  );

// ----- Generator -----

/**
 * Generator for prisma/prisma-model-authorizer
 *
 * Generates `{moduleFolder}/authorizers/{kebab-model}.authorizer.ts` files
 * that create a model authorizer with role check functions.
 */
export const prismaModelAuthorizerGenerator = createGenerator({
  name: 'prisma/prisma-model-authorizer',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  getInstanceName: (descriptor) => `${descriptor.modelName}Authorizer`,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        appModule: appModuleProvider,
        typescriptFile: typescriptFileProvider,
        prismaOutput: prismaOutputProvider,
        prismaAuthorizerUtilsImports: prismaAuthorizerUtilsImportsProvider,
      },
      outputs: {
        prismaModelAuthorizer: prismaModelAuthorizerProvider.export(
          packageScope,
          descriptor.modelName,
        ),
      },
      run({
        appModule,
        typescriptFile,
        prismaOutput,
        prismaAuthorizerUtilsImports,
      }) {
        const { modelName, idFieldName, roles } = descriptor;
        const modelVarName = lowercaseFirstChar(modelName);
        const authorizerName = `${modelVarName}Authorizer`;

        const authorizerFolder = posixJoin(
          appModule.getModuleFolder(),
          'authorizers',
        );
        const authorizerPath = posixJoin(
          authorizerFolder,
          `${kebabCase(modelName)}.authorizer.ts`,
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

            const prismaModelFragment =
              prismaOutput.getPrismaModelFragment(modelName);

            const fileFragment = tsTemplate`
              export const ${authorizerName} = ${prismaAuthorizerUtilsImports.createModelAuthorizer.fragment()}({
                model: '${modelVarName}',
                idField: '${idFieldName}',
                getModelById: (id) => ${prismaModelFragment}.findUnique({ where: { ${idFieldName}: id } }),
                roles: ${rolesFragment},
              });
            `;

            await builder.apply(
              typescriptFile.renderTemplateFragment({
                id: `prisma-model-authorizer:${modelName}`,
                destination: authorizerPath,
                fragment: fileFragment,
              }),
            );

            return {
              prismaModelAuthorizer: {
                getAuthorizerName() {
                  return authorizerName;
                },
                getAuthorizerFragment() {
                  return TsCodeUtils.importFragment(
                    authorizerName,
                    authorizerPath,
                  );
                },
                getRoleFragment(roleName: string) {
                  const validRoles = roles.map((r) => r.name);
                  if (!validRoles.includes(roleName)) {
                    throw new Error(
                      `Role '${roleName}' not found on ${modelName} authorizer. Available: ${validRoles.join(', ')}`,
                    );
                  }
                  return tsTemplate`${TsCodeUtils.importFragment(authorizerName, authorizerPath)}.roles.${roleName}`;
                },
              },
            };
          },
        };
      },
    }),
  }),
});
