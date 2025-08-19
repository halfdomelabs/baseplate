import type { ModelMergerModelInput } from '@baseplate-dev/project-builder-lib';

import type { AuthPluginDefinition } from '#src/auth/core/schema/plugin-definition.js';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

export function createAuthModels({
  authFeatureRef,
}: AuthPluginDefinition): Record<
  keyof typeof LOCAL_AUTH_MODELS,
  ModelMergerModelInput
> {
  return {
    user: {
      name: LOCAL_AUTH_MODELS.user,
      featureRef: authFeatureRef,
      model: {
        fields: [
          {
            name: 'id',
            type: 'uuid',
            options: { genUuid: true },
          },
          {
            name: 'name',
            type: 'string',
            isOptional: true,
          },
          {
            name: 'email',
            type: 'string',
          },
          {
            name: 'emailVerified',
            type: 'boolean',
            options: { default: 'false' },
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
        uniqueConstraints: [
          {
            fields: [{ fieldRef: 'email' }],
          },
        ],
      },
      graphql: {
        objectType: {
          enabled: true,
          fields: ['id', 'email'],
        },
      },
    },
    userAccount: {
      name: LOCAL_AUTH_MODELS.userAccount,
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
            name: 'accountId',
            type: 'string',
          },
          {
            name: 'providerId',
            type: 'string',
          },
          {
            name: 'password',
            type: 'string',
            isOptional: true,
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
            fields: [{ fieldRef: 'accountId' }, { fieldRef: 'providerId' }],
          },
        ],
        relations: [
          {
            name: 'user',
            references: [{ localRef: 'userId', foreignRef: 'id' }],
            modelRef: LOCAL_AUTH_MODELS.user,
            foreignRelationName: 'accounts',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          },
        ],
      },
    },
    userRole: {
      name: LOCAL_AUTH_MODELS.userRole,
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
            modelRef: LOCAL_AUTH_MODELS.user,
            foreignRelationName: 'roles',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          },
        ],
      },
    },
    userSession: {
      name: LOCAL_AUTH_MODELS.userSession,
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
            name: 'token',
            type: 'string',
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
            modelRef: LOCAL_AUTH_MODELS.user,
            foreignRelationName: 'sessions',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          },
        ],
      },
    },
  };
}
