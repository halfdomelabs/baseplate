import { ModelUtils } from '@src/definition/index.js';

import type {
  ParserPlugin,
  PluginMergeModelFieldInput,
  PluginMergeModelRelationInput,
} from '../types.js';

export const AuthPlugin: ParserPlugin = {
  name: 'AuthPlugin',
  run(projectDefinition, hooks) {
    const { auth } = projectDefinition;
    if (!auth || auth.useAuth0) {
      return;
    }

    // annotate user model
    const userFields: PluginMergeModelFieldInput[] = [
      {
        name: 'id',
        isLocked: true,
        type: 'uuid',
        options: { genUuid: true },
      },
      {
        name: 'email',
        isLocked: true,
        type: 'string',
      },
      {
        name: 'tokensNotBefore',
        isLocked: true,
        type: 'dateTime',
        isOptional: true,
      },
    ];
    if (auth.passwordProvider) {
      userFields.push({
        name: 'passwordHash',
        isLocked: true,
        type: 'string',
        isOptional: true,
      });
    }

    hooks.mergeModel({
      name: ModelUtils.byIdOrThrow(projectDefinition, auth.userModelRef).name,
      feature: auth.accountsFeatureRef,
      model: {
        primaryKeyFieldRefs: ['id'],
        fields: userFields,
      },
    });

    const userRoleFields: PluginMergeModelFieldInput[] = [
      {
        name: 'userId',
        type: 'uuid',
      },
      {
        name: 'role',
        type: 'string',
      },
    ];

    const userRoleRelations: PluginMergeModelRelationInput[] = [
      {
        name: 'user',
        references: [{ local: 'userId', foreign: 'id' }],
        modelName: auth.userModelRef,
        foreignRelationName: 'roles',
        onDelete: 'Cascade',
        onUpdate: 'Restrict',
        isLocked: true,
      },
    ];

    if (!auth.userRoleModelRef) {
      throw new Error(`User role model required`);
    }

    hooks.mergeModel({
      name: ModelUtils.byIdOrThrow(projectDefinition, auth.userRoleModelRef)
        .name,
      feature: auth.accountsFeatureRef,
      model: {
        fields: userRoleFields,
        relations: userRoleRelations,
        primaryKeyFieldRefs: ['userId', 'role'],
      },
    });

    // add global auth providers
    hooks.addFastifyChildren({
      $auth: {
        generator: '@halfdomelabs/fastify/auth/auth',
      },
      $pothosAuth: {
        generator: '@halfdomelabs/fastify/pothos/pothos-auth',
      },
    });

    hooks.addFeatureChildren(auth.authFeatureRef, {
      $auth: {
        generator: '@halfdomelabs/fastify/auth/auth-module',
        userModelName: ModelUtils.byIdOrThrow(
          projectDefinition,
          auth.userModelRef,
        ).name,
        children: {
          roleService: {
            name: 'AuthRoleService',
            generator: '@halfdomelabs/fastify/core/service-file',
            children: {
              $roles: {
                generator: '@halfdomelabs/fastify/auth/role-service',
                roles: auth.roles,
                children: {
                  $authRoles: {
                    generator: '@halfdomelabs/fastify/auth/auth-roles',
                    userRoleModelName: ModelUtils.byIdOrThrow(
                      projectDefinition,
                      auth.userRoleModelRef,
                    ).name,
                  },
                },
              },
            },
          },
        },
      },
      ...(auth.passwordProvider
        ? {
            $passwordAuthService: {
              name: 'PasswordAuthService',
              generator: '@halfdomelabs/fastify/auth/password-auth-service',
            },
            $passwordAuthMutations: {
              name: 'PasswordAuthMutations',
              generator: '@halfdomelabs/fastify/auth/password-auth-mutations',
            },
          }
        : {}),
    });

    hooks.addFeatureChildren(auth.accountsFeatureRef, {
      $hasherService: {
        name: 'HasherService',
        generator: '@halfdomelabs/fastify/auth/password-hasher-service',
      },
    });
  },
};
