import {
  ParserPlugin,
  PluginMergeModelFieldInput,
  PluginMergeModelRelationInput,
} from '../types.js';
import { FeatureUtils, ModelUtils } from '@src/definition/index.js';

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
        isId: true,
        options: { genUuid: true },
      },
      {
        name: 'email',
        isLocked: true,
        type: 'string',
        isUnique: true,
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
      name: ModelUtils.byId(projectDefinition, auth.userModel).name,
      feature: auth.accountsFeaturePath,
      model: {
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
        modelName: auth.userModel,
        foreignRelationName: 'roles',
        onDelete: 'Cascade',
        onUpdate: 'Restrict',
        isLocked: true,
      },
    ];

    if (!auth.userRoleModel) {
      throw new Error(`User role model required`);
    }

    hooks.mergeModel({
      name: ModelUtils.byId(projectDefinition, auth.userRoleModel).name,
      feature: auth.accountsFeaturePath,
      model: {
        fields: userRoleFields,
        relations: userRoleRelations,
        primaryKeys: ['userId', 'role'],
      },
    });

    // hoist hasher
    if (auth.passwordProvider) {
      // TODO: Move hasher service call into user service to make a bit more accessible
      hooks.addGlobalHoistedProviders('password-hasher-service');
    }

    hooks.addGlobalHoistedProviders([
      'auth-info',
      'auth-service-import',
      'auth-info-import',
    ]);

    // add global auth providers
    hooks.addFastifyChildren({
      $auth: {
        generator: '@halfdomelabs/fastify/auth/auth',
        peerProvider: true,
      },
      $authContext: {
        generator: '@halfdomelabs/fastify/auth/auth-context',
        peerProvider: true,
        authInfoRef: `${
          FeatureUtils.getFeatureByIdOrThrow(
            projectDefinition,
            auth.authFeaturePath,
          ).name
        }/root:$auth.service`,
      },
      $pothosAuth: {
        generator: '@halfdomelabs/fastify/pothos/pothos-auth',
        peerProvider: true,
      },
    });

    // add feature providers
    hooks.addFeatureHoistedProviders(auth.authFeaturePath, [
      'auth-service',
      'auth-mutations',
    ]);
    hooks.addFeatureChildren(auth.authFeaturePath, {
      $auth: {
        generator: '@halfdomelabs/fastify/auth/auth-module',
        userModelName: ModelUtils.byId(projectDefinition, auth.userModel).name,
        children: {
          roleService: {
            name: 'AuthRoleService',
            generator: '@halfdomelabs/fastify/core/service-file',
            peerProvider: true,
            children: {
              $roles: {
                generator: '@halfdomelabs/fastify/auth/role-service',
                roles: auth.roles,
                children: {
                  $authRoles: {
                    generator: '@halfdomelabs/fastify/auth/auth-roles',
                    userRoleModelName: ModelUtils.byId(
                      projectDefinition,
                      auth.userRoleModel,
                    ).name,
                  },
                },
              },
            },
          },
        },
      },
      ...(!auth.passwordProvider
        ? {}
        : {
            $passwordAuthService: {
              name: 'PasswordAuthService',
              generator: '@halfdomelabs/fastify/auth/password-auth-service',
              peerProvider: true,
            },
            $passwordAuthMutations: {
              name: 'PasswordAuthMutations',
              generator: '@halfdomelabs/fastify/auth/password-auth-mutations',
            },
          }),
    });

    hooks.addFeatureChildren(auth.accountsFeaturePath, {
      $hasherService: {
        name: 'HasherService',
        generator: '@halfdomelabs/fastify/auth/password-hasher-service',
      },
    });
  },
};
