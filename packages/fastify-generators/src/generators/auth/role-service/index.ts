import {
  ImportEntry,
  ImportMapper,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptSourceBlock,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import R from 'ramda';
import * as yup from 'yup';
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

const descriptorSchema = yup.object({
  userModelName: yup.string().required(),
  userRoleModelName: yup.string().required(),
  // Note: Anonymous and user roles are automatically added
  roles: yup.array(
    yup.object({
      name: yup.string().required(),
      comment: yup.string().required(),
      inherits: yup.array(yup.string().required()),
    })
  ),
});

interface RoleConfig {
  name: string;
  comment: string;
  inherits?: string[];
}

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
    { userModelName, userRoleModelName, roles },
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

    if (roles?.some((r) => ['anonymous', 'user'].includes(r.name))) {
      throw new Error(
        'Anonymous and user roles are automatically added and cannot be manually included'
      );
    }

    const compiledRoles: RoleConfig[] = [
      {
        name: 'anonymous',
        comment: 'Anonymous role for unauthenticated users',
      },
      {
        name: 'user',
        comment: 'Role for authenticated users',
        inherits: ['anonymous'],
      },
      ...(roles || []),
    ];

    headerBlock.addCodeEntries({
      USER: prismaOutput.getModelTypeExpression(userModelName),
      USER_ROLE: prismaOutput.getModelTypeExpression(userRoleModelName),
      AVAILABLE_ROLES_EXPORT: `export type AuthRole = ${compiledRoles
        .map(({ name }) => `'${name}'`)
        .join(' | ')}`,
      ROLE_MAP: JSON.stringify(
        R.mergeAll(
          compiledRoles.map(({ name, comment, inherits }) => ({
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
      value: serviceFile
        .getServiceExpression()
        .append('.getRolesForUser(user)'),
      type: TypescriptCodeUtils.createExpression(
        `AuthRole[]`,
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
