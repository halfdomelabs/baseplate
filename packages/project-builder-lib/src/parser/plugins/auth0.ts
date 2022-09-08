import { ParserPlugin, PluginMergeModelFieldInput } from '../types';

export const Auth0Plugin: ParserPlugin = {
  name: 'AuthPlugin',
  run(projectConfig, hooks) {
    const { auth } = projectConfig;
    if (!auth || !auth.useAuth0) {
      return;
    }

    hooks.addGlobalHoistedProviders(['auth-info', 'auth-info-import']);

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
        name: 'auth0Id',
        isLocked: true,
        type: 'string',
        isOptional: true,
      },
    ];

    hooks.mergeModel({
      name: auth.userModel,
      feature: auth.accountsFeaturePath,
      model: {
        fields: userFields,
      },
    });

    // add global auth providers
    hooks.addFastifyChildren({
      $auth: {
        generator: '@baseplate/fastify/auth/auth',
        peerProvider: true,
      },
      $nexusAuth: {
        generator: '@baseplate/fastify/nexus/nexus-auth',
        peerProvider: true,
        authInfoRef: `${auth.authFeaturePath}/root:$auth0`,
      },
    });

    // add feature providers
    hooks.addFeatureHoistedProviders(auth.authFeaturePath, ['role-service']);
    hooks.addFeatureChildren(auth.authFeaturePath, {
      $roleService: {
        name: 'AuthRoleService',
        generator: '@baseplate/fastify/core/service-file',
        peerProvider: true,
        children: {
          $roles: {
            generator: '@baseplate/fastify/auth/role-service',
            roles: auth.roles,
            peerProvider: true,
          },
        },
      },
      $auth0: {
        generator: '@baseplate/fastify/auth0/auth0-module',
        userModelName: auth.userModel,
        includeManagement: true,
      },
    });
  },
};
