import {
  ParserPlugin,
  PluginMergeModelFieldInput,
  PluginMergeModelRelationInput,
} from '../types.js';
import { FeatureUtils, ModelUtils } from '@src/definition/index.js';

export const Auth0Plugin: ParserPlugin = {
  name: 'AuthPlugin',
  run(projectDefinition, hooks, definitionContainer) {
    const { auth } = projectDefinition;
    if (!auth?.useAuth0) {
      return;
    }

    hooks.addGlobalHoistedProviders([
      'auth-info',
      'auth-service-import',
      'auth-info-import',
    ]);

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
        isUnique: false,
      },
      {
        name: 'auth0Id',
        isLocked: true,
        type: 'string',
        isOptional: true,
        isUnique: true,
      },
    ];

    hooks.mergeModel({
      name: ModelUtils.byIdOrThrow(projectDefinition, auth.userModel).name,
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
      name: ModelUtils.byIdOrThrow(projectDefinition, auth.userRoleModel).name,
      feature: auth.accountsFeaturePath,
      model: {
        fields: userRoleFields,
        relations: userRoleRelations,
        primaryKeys: ['userId', 'role'],
      },
    });

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
        }/root:$auth0`,
      },
      $pothosAuth: {
        generator: '@halfdomelabs/fastify/pothos/pothos-auth',
        peerProvider: true,
      },
    });

    // add feature providers
    hooks.addFeatureHoistedProviders(auth.authFeaturePath, ['role-service']);
    hooks.addFeatureChildren(auth.authFeaturePath, {
      $roleService: {
        name: 'AuthRoleService',
        generator: '@halfdomelabs/fastify/core/service-file',
        peerProvider: true,
        children: {
          $roles: {
            generator: '@halfdomelabs/fastify/auth/role-service',
            roles: auth.roles.map((r) => ({
              name: r.name,
              comment: r.comment,
              inherits: !r.inherits?.length
                ? undefined
                : r.inherits?.map((inheritRole) =>
                    definitionContainer.nameFromId(inheritRole),
                  ),
            })),
            peerProvider: true,
          },
        },
      },
      $auth0: {
        generator: '@halfdomelabs/fastify/auth0/auth0-module',
        userModelName: ModelUtils.byIdOrThrow(projectDefinition, auth.userModel)
          .name,
        includeManagement: true,
      },
    });
  },
};
