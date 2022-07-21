import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { authPluginProvider } from '../auth-plugin';
import { authServiceProvider } from '../auth-service';
import { roleServiceProvider } from '../role-service';

const descriptorSchema = z.object({
  userModelName: z.string().min(1),
  userRoleModelName: z.string().min(1),
});

export type AuthRolesProvider = unknown;

export const authRolesProvider =
  createProviderType<AuthRolesProvider>('auth-roles');

const AuthRolesGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    authPlugin: authPluginProvider,
    authService: authServiceProvider,
    roleService: roleServiceProvider,
    prismaOutput: prismaOutputProvider,
  },
  exports: {
    authRoles: authRolesProvider,
  },
  createGenerator(
    { userModelName, userRoleModelName },
    { authPlugin, prismaOutput, authService, roleService }
  ) {
    const authRolesType = TypescriptCodeUtils.createExpression(
      `AuthRole[]`,
      `import {AuthRole} from '%role-service'`,
      { importMappers: [roleService] }
    );

    authPlugin.registerAuthField({
      key: 'roles',
      hookBody: roleService
        .getServiceExpression()
        .wrap(
          (contents) =>
            `const roles = ${contents}.populateAuthRoles(user?.roles.map(role => role.role));`
        )
        .toBlock(),
      extraCreateArgs: [{ name: 'roles', type: authRolesType }],
      value: TypescriptCodeUtils.createExpression('roles'),
      type: authRolesType,
    });

    authPlugin.registerAuthField({
      key: 'hasSomeRole',
      value: new TypescriptCodeExpression(
        '(possibleRoles) => roles.some((role) => possibleRoles.includes(role))'
      ),
      type: TypescriptCodeUtils.createExpression(
        `(possibleRoles: AuthRole[]) => boolean`,
        `import {AuthRole} from '%role-service'`,
        { importMappers: [roleService] }
      ),
    });

    authPlugin.registerAuthField({
      key: 'hasRole',
      value: new TypescriptCodeExpression('(role) => roles.includes(role)'),
      type: TypescriptCodeUtils.createExpression(
        `(role: AuthRole) => boolean`,
        `import {AuthRole} from '%role-service'`,
        { importMappers: [roleService] }
      ),
    });

    const userWithRolesType = TypescriptCodeUtils.createExpression(
      `UserWithRoles`,
      `import {UserWithRoles} from '${roleService.getServiceImport()}'`
    );

    authPlugin.setCustomAuthUserType(userWithRolesType);

    authService.setCustomUserFromToken({
      type: userWithRolesType,
      queryParams: {
        include: `{ roles: true }`,
      },
    });

    roleService.addHeaderBlock(
      TypescriptCodeUtils.formatBlock(
        `export type UserWithRoles = USER_MODEL & { roles: USER_ROLE_MODEL[] };`,
        {
          USER_MODEL: prismaOutput.getModelTypeExpression(userModelName),
          USER_ROLE_MODEL:
            prismaOutput.getModelTypeExpression(userRoleModelName),
        }
      )
    );

    return {
      getProviders: () => ({
        authRoles: {},
      }),
      build: async () => {},
    };
  },
});

export default AuthRolesGenerator;
