import { typescriptProvider } from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
} from '@baseplate/sync';
import R from 'ramda';
import * as yup from 'yup';
import { prismaOutputProvider } from '@src/generators/prisma/prisma';

/**
 * Requires a UserModel schema
 *
 * userId: string
 * role: string
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

export type RolesServiceProvider = unknown;

export const rolesServiceProvider =
  createProviderType<RolesServiceProvider>('roles-service');

const RolesServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    prismaOutput: prismaOutputProvider,
  },
  exports: {
    rolesService: rolesServiceProvider,
  },
  createGenerator(
    { userModelName, userRoleModelName, roles },
    { typescript, prismaOutput }
  ) {
    const serviceFile = typescript.createTemplate({
      USER: {
        type: 'code-expression',
      },
      USER_ROLE: { type: 'code-expression' },
      AVAILABLE_ROLES: { type: 'code-expression' },
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

    serviceFile.addCodeEntries({
      USER: prismaOutput.getModelTypeExpression(userModelName),
      USER_ROLE: prismaOutput.getModelTypeExpression(userRoleModelName),
      AVAILABLE_ROLES: compiledRoles.map(({ name }) => name).join(' | '),
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

    return {
      getProviders: () => ({
        rolesService: {},
      }),
      build: async (builder) => {
        await builder.apply(
          serviceFile.renderToAction('services/user-role-service.ts')
        );
      },
    };
  },
});

export default RolesServiceGenerator;
