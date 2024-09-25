// @ts-nocheck
import { objectType } from 'nexus';
import { renewToken } from '%auth-service';
import { InvalidTokenError } from '%jwt-service';
import {
  clearRefreshTokenFromCookie,
  getRefreshTokenFromCookie,
  setRefreshTokenIntoCookie,
} from '../utils/refresh-tokens.js';
import { createStandardMutation } from '%nexus/utils';

export const authPayloadObjectType = objectType({
  name: 'AuthPayload',
  definition(t) {
    t.nonNull.string('userId');
    t.string('refreshToken');
    t.nonNull.string('accessToken');
  },
});

export const refreshTokenMutation = createStandardMutation({
  name: 'refreshToken',
  inputDefinition: (t) => {
    t.nonNull.string('userId');
    t.string('refreshToken');
  },
  payloadDefinition: (t) => {
    t.nonNull.field('authPayload', { type: 'AuthPayload' });
  },
  authorize: AUTHORIZE_ANONYMOUS,
  resolve: async (root, { input }, context) => {
    const refreshToken =
      input.refreshToken ?? getRefreshTokenFromCookie(context);
    if (!refreshToken) {
      throw new InvalidTokenError('Missing refresh token');
    }
    const { userId } = input;

    const { accessToken, refreshToken: newRefreshToken } = await renewToken(
      userId,
      refreshToken,
    );

    if (!input.refreshToken) {
      setRefreshTokenIntoCookie(context, newRefreshToken);
    }

    return {
      authPayload: {
        userId,
        accessToken,
        refreshToken: input.refreshToken ? newRefreshToken : undefined,
      },
    };
  },
});

export const logOutMutation = createStandardMutation({
  name: 'logOut',
  authorize: AUTHORIZE_USER,
  payloadDefinition: (t) => {
    t.nonNull.boolean('success');
  },
  resolve: async (root, args, context) => {
    clearRefreshTokenFromCookie(context);
    return { success: true };
  },
});
