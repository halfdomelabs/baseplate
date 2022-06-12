import {
  ImportEntry,
  ImportMapper,
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
import { authPluginProvider } from '../auth-plugin';
import { authServiceProvider } from '../auth-service';

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

export type RoleServiceProvider = ImportMapper;

export const roleServiceProvider =
  createProviderType<RoleServiceProvider>('role-service');

const RoleServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    prismaOutput: prismaOutputProvider,
    authPlugin: authPluginProvider,
    appModule: appModuleProvider,
    serviceFile: serviceFileProvider,
    authService: authServiceProvider,
    authSetup: authSetupProvider,
  },
  exports: {
    roleService: roleServiceProvider,
  },
  createGenerator(
    { userModelName, userRoleModelName, roles = [] },
    { serviceFile, prismaOutput, authPlugin, appModule, authService, authSetup }
  ) {
    const headerBlock = new TypescriptSourceBlock({
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

    authPlugin.registerAuthField({
      key: 'roles',
      hookBody: serviceFile
        .getServiceExpression()
        .wrap((contents) => `const roles = ${contents}.getRolesForUser(user);`)
        .toBlock(),
      value: TypescriptCodeUtils.createExpression('roles'),
      type: TypescriptCodeUtils.createExpression(
        `AuthRole[]`,
        `import {AuthRole} from '${serviceFile.getServiceImport()}'`
      ),
    });

    authPlugin.registerAuthField({
      key: 'hasSomeRole',
      value: new TypescriptCodeExpression(
        '(possibleRoles) => roles.some((role) => possibleRoles.includes(role))'
      ),
      type: TypescriptCodeUtils.createExpression(
        `(possibleRoles: AuthRole[]) => boolean`,
        `import {AuthRole} from '${serviceFile.getServiceImport()}'`
      ),
    });

    const userWithRolesType = TypescriptCodeUtils.createExpression(
      `UserWithRoles`,
      `import {UserWithRoles} from '${serviceFile.getServiceImport()}'`
    );

    authPlugin.setCustomAuthUserType(userWithRolesType);
    const roleServiceImport: ImportEntry = {
      path: serviceFile.getServiceImport(),
      allowedImports: ['UserWithRoles', 'AUTH_ROLE_CONFIG', 'AuthRole'],
    };
    authSetup.getConfig().set('roleServiceImport', roleServiceImport);

    authService.setCustomUserFromToken({
      type: userWithRolesType,
      queryParams: {
        include: `{ roles: true }`,
      },
    });

    return {
      getProviders: () => ({
        roleService: {
          getImportMap: () => ({
            '%role-service': roleServiceImport,
          }),
        },
      }),
      build: async (builder) => {
        builder.setBaseDirectory(appModule.getModuleFolder());

        const template = await builder.readTemplate(
          'services/auth-role-service.ts'
        );

        serviceFile.registerMethod(
          'getRolesForUser',
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
