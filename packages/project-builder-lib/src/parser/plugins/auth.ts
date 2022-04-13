import {
  ParserPlugin,
  PluginMergeModelFieldInput,
  PluginMergeModelRelationInput,
} from '../types';

export const AuthPlugin: ParserPlugin = {
  name: 'AuthPlugin',
  run(projectConfig, hooks) {
    const { auth } = projectConfig;
    if (!auth) {
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
        relationshipType: 'oneToMany',
        isOptional: false,
        onDelete: 'Cascade',
        onUpdate: 'Restrict',
        isLocked: true,
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
