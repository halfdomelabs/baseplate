import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { LOCAL_AUTH_MODELS } from '#src/local-auth/constants/model-names.js';

export function createLocalAuthPartialDefinition(
  authFeatureName: string,
): PartialProjectDefinitionInput {
  return {
    models: [
      {
        name: LOCAL_AUTH_MODELS.user,
        featureRef: authFeatureName,
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
            fields: [{ ref: 'id' }, { ref: 'email' }],
          },
        },
      },
      {
        name: LOCAL_AUTH_MODELS.userAccount,
        featureRef: authFeatureName,
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
      {
        name: LOCAL_AUTH_MODELS.userRole,
        featureRef: authFeatureName,
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
      {
        name: LOCAL_AUTH_MODELS.userSession,
        featureRef: authFeatureName,
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
      {
        name: LOCAL_AUTH_MODELS.authVerification,
        featureRef: authFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              name: 'type',
              type: 'string',
            },
            {
              name: 'identifier',
              type: 'string',
            },
            {
              name: 'value',
              type: 'string',
            },
            {
              name: 'userId',
              type: 'uuid',
              isOptional: true,
            },
            {
              name: 'metadata',
              type: 'json',
              isOptional: true,
            },
            {
              name: 'expiresAt',
              type: 'dateTime',
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
              fields: [{ fieldRef: 'type' }, { fieldRef: 'identifier' }],
            },
          ],
          relations: [
            {
              name: 'user',
              references: [{ localRef: 'userId', foreignRef: 'id' }],
              modelRef: LOCAL_AUTH_MODELS.user,
              foreignRelationName: 'authVerifications',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
    ],
  };
}
