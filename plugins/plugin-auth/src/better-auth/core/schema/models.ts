import type { PartialProjectDefinitionInput } from '@baseplate-dev/project-builder-lib';

import { BETTER_AUTH_MODELS } from '#src/better-auth/constants/model-names.js';

export function createBetterAuthPartialDefinition(
  authFeatureName: string,
): PartialProjectDefinitionInput {
  return {
    models: [
      {
        name: BETTER_AUTH_MODELS.user,
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
              isOptional: false,
            },
            {
              name: 'email',
              type: 'string',
              isOptional: false,
            },
            {
              name: 'emailVerified',
              type: 'boolean',
              options: { default: 'false' },
            },
            {
              name: 'image',
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
        name: BETTER_AUTH_MODELS.session,
        featureRef: authFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
            },
            {
              name: 'expiresAt',
              type: 'dateTime',
            },
            {
              name: 'token',
              type: 'string',
            },
            {
              name: 'ipAddress',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'userAgent',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'userId',
              type: 'uuid',
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
              modelRef: BETTER_AUTH_MODELS.user,
              foreignRelationName: 'sessions',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
      {
        name: BETTER_AUTH_MODELS.account,
        featureRef: authFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
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
              name: 'userId',
              type: 'uuid',
            },
            {
              name: 'accessToken',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'refreshToken',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'idToken',
              type: 'string',
              isOptional: true,
            },
            {
              name: 'accessTokenExpiresAt',
              type: 'dateTime',
              isOptional: true,
            },
            {
              name: 'refreshTokenExpiresAt',
              type: 'dateTime',
              isOptional: true,
            },
            {
              name: 'scope',
              type: 'string',
              isOptional: true,
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
          relations: [
            {
              name: 'user',
              references: [{ localRef: 'userId', foreignRef: 'id' }],
              modelRef: BETTER_AUTH_MODELS.user,
              foreignRelationName: 'accounts',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
      {
        name: BETTER_AUTH_MODELS.verification,
        featureRef: authFeatureName,
        model: {
          fields: [
            {
              name: 'id',
              type: 'uuid',
              options: { genUuid: true },
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
              name: 'expiresAt',
              type: 'dateTime',
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
        },
      },
      {
        name: BETTER_AUTH_MODELS.userRole,
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
              modelRef: BETTER_AUTH_MODELS.user,
              foreignRelationName: 'roles',
              onDelete: 'Cascade',
              onUpdate: 'Restrict',
            },
          ],
        },
      },
    ],
  };
}
