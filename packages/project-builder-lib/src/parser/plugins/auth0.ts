import { ModelUtils } from '@src/definition/index.js';
import { modelUniqueConstraintEntityType } from '@src/schema/index.js';

import type {
  ParserPlugin,
  PluginMergeModelFieldInput,
  PluginMergeModelRelationInput,
} from '../types.js';

export const Auth0Plugin: ParserPlugin = {
  name: 'AuthPlugin',
  run(projectDefinition, hooks) {
    const { auth } = projectDefinition;
    if (!auth?.useAuth0) {
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
        name: 'auth0Id',
        isLocked: true,
        type: 'string',
        isOptional: true,
      },
    ];

    hooks.mergeModel({
      name: ModelUtils.byIdOrThrow(projectDefinition, auth.userModelRef).name,
      feature: auth.accountsFeatureRef,
      model: {
        primaryKeyFieldRefs: ['id'],
        uniqueConstraints: [
          {
            id: modelUniqueConstraintEntityType.generateNewId(),
            fields: [{ fieldRef: 'auth0Id' }],
          },
        ],
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

    // add feature providers
    hooks.addFeatureChildren(auth.authFeatureRef, {
      $authContext: {
        generator: '@halfdomelabs/fastify/auth/auth-context',
      },
      $authPlugin: {
        generator: '@halfdomelabs/fastify/auth/auth-plugin',
      },
      $authRoles: {
        generator: '@halfdomelabs/fastify/auth/auth-roles',
        roles: auth.roles.map((r) => ({
          name: r.name,
          comment: r.comment,
          builtIn: r.builtIn,
        })),
      },
      $auth0: {
        generator: '@halfdomelabs/fastify/auth0/auth0-module',
        userModelName: ModelUtils.byIdOrThrow(
          projectDefinition,
          auth.userModelRef,
        ).name,
        includeManagement: true,
      },
      $userSession: {
        generator: '@halfdomelabs/fastify/auth/user-session-types',
      },
    });
  },
};
