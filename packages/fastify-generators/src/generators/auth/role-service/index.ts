import {
  ImportEntry,
  ImportMapper,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptSourceBlock,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import R from 'ramda';
import { z } from 'zod';
import { appModuleProvider } from '@src/generators/core/root-module';
import { serviceFileProvider } from '@src/generators/core/service-file';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { authSetupProvider } from '../auth';

/**
 * UserRole schema:
 *
 * userId: string
 * role: string
 *
 * User table:
 *
 * roles: UserRole[]
 */

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
  userRoleModelName: z.string().min(1),
  // Note: Anonymous and user roles are automatically added
  roles: z
    .array(
      z.object({
        name: z.string().min(1),
        comment: z.string().min(1),
        inherits: z.array(z.string().min(1)).optional(),
      })
    )
    .optional(),
});

export interface RoleServiceProvider extends ImportMapper {
  addHeaderBlock(block: TypescriptCodeBlock): void;
  getServiceExpression(): TypescriptCodeExpression;
  getServiceImport(): string;
}

export const roleServiceProvider =
  createProviderType<RoleServiceProvider>('role-service');

const RoleServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    prismaOutput: prismaOutputProvider,
    appModule: appModuleProvider,
    serviceFile: serviceFileProvider,
    authSetup: authSetupProvider,
  },
  exports: {
    roleService: roleServiceProvider,
  },
  createGenerator(
    { userModelName, userRoleModelName, roles = [] },
    { serviceFile, prismaOutput, appModule, authSetup }
  ) {
    const customHeaderBlocks: TypescriptCodeBlock[] = [];
    const headerBlock = new TypescriptSourceBlock({
      HEADER: { type: 'code-block' },
      USER: {
        type: 'code-expression',
      },
      USER_ROLE: { type: 'code-expression' },
      AVAILABLE_ROLES_EXPORT: { type: 'code-block' },
      ROLE_MAP: { type: 'code-expression' },
    });

    if (
      !['anonymous', 'user'].every((name) => roles.some((r) => r.name === name))
    ) {
      throw new Error('Anonymous and user roles are required to be added');
    }

    headerBlock.addCodeEntries({
      USER: prismaOutput.getModelTypeExpression(userModelName),
      USER_ROLE: prismaOutput.getModelTypeExpression(userRoleModelName),
      AVAILABLE_ROLES_EXPORT: `export type AuthRole = ${roles
        .map(({ name }) => `'${name}'`)
        .join(' | ')}`,
      ROLE_MAP: JSON.stringify(
        R.mergeAll(
          roles.map(({ name, comment, inherits }) => ({
            [name]: {
              comment,
              inherits,
            },
          }))
        )
      ),
    });

    const roleServiceImport: ImportEntry = {
      path: serviceFile.getServiceImport(),
      allowedImports: ['AUTH_ROLE_CONFIG', 'AuthRole'],
    };

    authSetup.getConfig().set('roleServiceImport', roleServiceImport);

    return {
      getProviders: () => ({
        roleService: {
          getImportMap: () => ({
            '%role-service': roleServiceImport,
          }),
          addHeaderBlock(block) {
            customHeaderBlocks.push(block);
          },
          getServiceExpression: () => serviceFile.getServiceExpression(),
          getServiceImport: () => serviceFile.getServiceImport(),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(appModule.getModuleFolder());

        const template = await builder.readTemplate(
          'services/auth-role-service.ts'
        );

        headerBlock.addCodeEntries({ HEADER: customHeaderBlocks });

        serviceFile.registerMethod(
          'populateAuthRoles',
          TypescriptCodeUtils.createExpression(
            TypescriptCodeUtils.extractTemplateSnippet(template, 'BODY'),
            undefined,
            {
              headerBlocks: [
                headerBlock.renderToBlock(
                  TypescriptCodeUtils.extractTemplateSnippet(template, 'HEADER')
                ),
              ],
            }
          )
        );
      },
    };
  },
});

export default RoleServiceGenerator;
