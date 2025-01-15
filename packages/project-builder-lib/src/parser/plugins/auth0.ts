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
      featureRef: auth.accountsFeatureRef,
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
        references: [{ localRef: 'userId', foreignRef: 'id' }],
        modelRef: auth.userModelRef,
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
      featureRef: auth.accountsFeatureRef,
      model: {
        fields: userRoleFields,
        relations: userRoleRelations,
        primaryKeyFieldRefs: ['userId', 'role'],
      },
    });
  },
};
