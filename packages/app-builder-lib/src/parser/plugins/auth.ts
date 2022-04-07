import {
  ParserPlugin,
  PluginMergeModelFieldInput,
  PluginMergeModelRelationInput,
} from '../types';

export const AuthPlugin: ParserPlugin = {
  name: 'AuthPlugin',
  run(appConfig, hooks) {
    const { auth } = appConfig;
    if (!auth) {
      return;
    }

    // annotate user model
    const userFields: PluginMergeModelFieldInput[] = [
      {
        name: 'id',
        isModelLocked: true,
        model: { type: 'uuid', id: true, genUuid: true },
      },
      {
        name: 'email',
        isModelLocked: true,
        model: { type: 'string', unique: true },
      },
      {
        name: 'tokensNotBefore',
        isModelLocked: true,
        model: { type: 'dateTime', optional: true },
      },
    ];
    if (auth.passwordProvider) {
      userFields.push({
        name: 'passwordHash',
        isModelLocked: true,
        model: { type: 'string', optional: true },
      });
    }

    hooks.mergeModel({
      name: auth.userModel,
      feature: auth.accountsFeaturePath,
      model: {
        fields: userFields,
      },
      service: !auth.passwordProvider
        ? {}
        : {
            createTransformers: {
              $passwordHash: {
                generator:
                  '@baseplate/fastify/auth/password-create-transformer',
              },
            },
            updateTransformers: {
              $passwordHash: {
                generator:
                  '@baseplate/fastify/auth/password-update-transformer',
              },
            },
          },
    });

    const userRoleFields: PluginMergeModelFieldInput[] = [
      {
        name: 'userId',
        model: { type: 'uuid' },
      },
      {
        name: 'role',
        model: { type: 'string' },
      },
    ];

    const userRoleRelations: PluginMergeModelRelationInput[] = [
      {
        name: 'user',
        model: {
          fields: ['userId'],
          references: ['id'],
          modelName: auth.userModel,
          foreignFieldName: 'roles',
          relationshipType: 'oneToMany',
          optional: false,
          onDelete: 'Cascade',
          onUpdate: 'Restrict',
        },
        isModelLocked: true,
      },
    ];

    hooks.mergeModel({
      name: auth.userRoleModel,
      feature: auth.accountsFeaturePath,
      model: {
        fields: userRoleFields,
        relations: userRoleRelations,
        primaryKeys: ['userId', 'role'],
      },
    });

    // hoist hasher
    if (auth.passwordProvider) {
      // TODO: Move hasher service call into user service to make a bit more normal
      hooks.addGlobalHoistedProviders('password-hasher-service');
    }

    // add global auth providers
    hooks.addFastifyChildren({
      $auth: {
        generator: '@baseplate/fastify/auth/auth',
        peerProvider: true,
      },
      $nexusAuth: {
        generator: '@baseplate/fastify/nexus/nexus-auth',
        peerProvider: true,
        authPluginRef: `${auth.authFeaturePath}/root:$auth.authPlugin`,
      },
    });

    // add feature providers
    hooks.addFeatureHoistedProviders(auth.authFeaturePath, [
      'auth-service',
      'auth-mutations',
    ]);
    hooks.addFeatureChildren(auth.authFeaturePath, {
      $auth: {
        generator: '@baseplate/fastify/auth/auth-module',
        userModelName: auth.userModel,
        children: {
          roleService: {
            name: 'AuthRoleService',
            generator: '@baseplate/fastify/core/service-file',
            peerProvider: true,
            children: {
              $roles: {
                generator: '@baseplate/fastify/auth/role-service',
                userModelName: auth.userModel,
                userRoleModelName: auth.userRoleModel,
                roles: auth.roles,
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
              generator: '@baseplate/fastify/auth/password-auth-service',
              peerProvider: true,
            },
            $passwordAuthMutations: {
              name: 'PasswordAuthMutations',
              generator: '@baseplate/fastify/auth/password-auth-mutations',
            },
          }),
    });

    hooks.addFeatureChildren(auth.accountsFeaturePath, {
      $hasherService: {
        name: 'HasherService',
        generator: '@baseplate/fastify/auth/password-hasher-service',
      },
    });
  },
};
