// @ts-nocheck

import { NexusGenFieldTypes } from '%nexus/typegen';
import { RequestServiceContext } from '%request-service-context';
import { config } from '%config';
import {
  AuthPayload,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from '../services/auth-service';

// localhost does not appear to support the __Host prefix
export const REFRESH_TOKEN_COOKIE_NAME =
  config.APP_ENVIRONMENT === 'development'
    ? 'auth-refresh-token'
    : '__Host-auth_refresh_token';

export function getRefreshTokenFromCookie(
  context: RequestServiceContext
): string | undefined {
  return context.cookieStore.get(REFRESH_TOKEN_COOKIE_NAME);
}

export function setRefreshTokenIntoCookie(
  context: RequestServiceContext,
  refreshToken: string
): void {
  context.cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}

export function clearRefreshTokenFromCookie(
  context: RequestServiceContext
): void {
  context.cookieStore.clear(REFRESH_TOKEN_COOKIE_NAME);
}

export function formatRefreshTokens(
  context: RequestServiceContext,
  payload: AuthPayload
): NexusGenFieldTypes['AuthPayload'] {
  // if request needs refresh token returned directly, e.g. mobile app
  // return the refresh token in the payload
  if (context.reqInfo.headers['x-refresh-token-format'] === 'payload') {
    return payload;
  }

  // otherwise, return the access token in the cookie
  setRefreshTokenIntoCookie(context, payload.refreshToken);

  return {
    ...payload,
    refreshToken: null,
  };
}
