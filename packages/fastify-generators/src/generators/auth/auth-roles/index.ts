import {
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import {
  createGeneratorWithChildren,
  createProviderType,
} from '@baseplate/sync';
import { z } from 'zod';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';
import { authInfoProvider } from '../auth-service';
import { roleServiceProvider } from '../role-service';

const descriptorSchema = z.object({
  userRoleModelName: z.string().min(1),
});

export type AuthRolesProvider = unknown;

export const authRolesProvider =
  createProviderType<AuthRolesProvider>('auth-roles');

const AuthRolesGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    authInfo: authInfoProvider,
    roleService: roleServiceProvider,
    prismaOutput: prismaOutputProvider,
  },
  exports: {
    authRoles: authRolesProvider,
  },
  createGenerator(
    { userRoleModelName },
    { authInfo, prismaOutput, roleService }
  ) {
    const authRolesType = TypescriptCodeUtils.createExpression(
      `AuthRole[]`,
      `import {AuthRole} from '%role-service'`,
      { importMappers: [roleService] }
    );

    const rolesCreatorBody: TypescriptCodeBlock =
      TypescriptCodeUtils.formatBlock(
        `const userRoles = await USER_ROLE_MODEL.findMany({
        where: { userId: user.id },
      });
      
      const roles = ROLES_SERVICE.populateAuthRoles(userRoles.map(r => r.role));`,
        {
          USER_ROLE_MODEL:
            prismaOutput.getPrismaModelExpression(userRoleModelName),
          ROLES_SERVICE: roleService.getServiceExpression(),
        }
      );

    authInfo.registerAuthField({
      key: 'roles',
      creatorBody: rolesCreatorBody,
      extraCreateArgs: [{ name: 'roles', type: authRolesType }],
      value: TypescriptCodeUtils.createExpression('roles'),
      type: authRolesType,
    });

    authInfo.registerAuthField({
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

    authInfo.registerAuthField({
      key: 'hasRole',
      value: new TypescriptCodeExpression('(role) => roles.includes(role)'),
      type: TypescriptCodeUtils.createExpression(
        `(role: AuthRole) => boolean`,
        `import {AuthRole} from '%role-service'`,
        { importMappers: [roleService] }
      ),
    });

    return {
      getProviders: () => ({
        authRoles: {},
      }),
      build: async () => {},
    };
  },
});

export default AuthRolesGenerator;
