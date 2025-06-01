import type { ModelMergerModelInput } from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from './plugin-definition.js';

export function createAuthModels({
  authFeatureRef,
  modelRefs,
}: Pick<AuthPluginDefinition, 'authFeatureRef' | 'modelRefs'>): {
  user: ModelMergerModelInput;
  userAccount: ModelMergerModelInput;
  userRole: ModelMergerModelInput;
  userSession: ModelMergerModelInput;
} {
  return {
    user: {
      name: modelRefs.user,
      featureRef: authFeatureRef,
      model: {
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            name: 'email',
            type: 'string',
            isOptional: true,
          },
          {
            name: 'phone',
            type: 'string',
            isOptional: true,
          },
          {
            name: 'updatedAt',
            type: 'dateTime',
            options: { defaultToNow: true, updatedAt: true },
          },
          {
            name: 'createdAt',
            type: 'dateTime',
            options: { defaultToNow: true },
          },
        ],
        primaryKeyFieldRefs: ['id'],
      },
    },
    userAccount: {
      name: modelRefs.userAccount,
      featureRef: authFeatureRef,
      model: {
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'providerType',
            type: 'string',
          },
          {
            name: 'providerId',
            type: 'string',
          },
          {
            name: 'providerSecret',
            type: 'string',
          },
          {
            name: 'createdAt',
            type: 'dateTime',
            options: { defaultToNow: true },
          },
          {
            name: 'updatedAt',
            type: 'dateTime',
            options: { defaultToNow: true, updatedAt: true },
          },
        ],
        primaryKeyFieldRefs: ['id'],
        uniqueConstraints: [
          {
            fields: [{ fieldRef: 'providerType' }, { fieldRef: 'providerId' }],
          },
        ],
        relations: [
          {
            name: 'user',
            references: [{ localRef: 'userId', foreignRef: 'id' }],
            modelRef: modelRefs.user,
            foreignRelationName: 'authProviders',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          },
        ],
      },
    },
    userRole: {
      name: modelRefs.userRole,
      featureRef: authFeatureRef,
      model: {
        fields: [
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'string',
          },
          {
            name: 'updatedAt',
            type: 'dateTime',
            options: { defaultToNow: true, updatedAt: true },
          },
          {
            name: 'createdAt',
            type: 'dateTime',
            options: { defaultToNow: true },
          },
        ],
        primaryKeyFieldRefs: ['userId', 'role'],
        relations: [
          {
            name: 'user',
            references: [{ localRef: 'userId', foreignRef: 'id' }],
            modelRef: modelRefs.user,
            foreignRelationName: 'roles',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          },
        ],
      },
    },
    userSession: {
      name: modelRefs.userSession,
      featureRef: authFeatureRef,
      model: {
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            name: 'token',
            type: 'string',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'expiresAt',
            type: 'dateTime',
          },
          {
            name: 'renewedAt',
            type: 'dateTime',
            options: { defaultToNow: true },
          },
          {
            name: 'createdAt',
            type: 'dateTime',
            options: { defaultToNow: true },
          },
          {
            name: 'updatedAt',
            type: 'dateTime',
            options: { defaultToNow: true, updatedAt: true },
          },
        ],
        primaryKeyFieldRefs: ['id'],
        uniqueConstraints: [
          {
            fields: [{ fieldRef: 'token' }],
          },
        ],
        relations: [
          {
            name: 'user',
            references: [{ localRef: 'userId', foreignRef: 'id' }],
            modelRef: modelRefs.user,
            foreignRelationName: 'sessions',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          },
        ],
      },
    },
  };
}
