// @ts-nocheck

import { NexusGenFieldTypes } from '%nexus/typegen';
import { RequestServiceContext } from '%request-service-context';
import { config } from '%config';
import {
  AuthPayload,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from '../services/auth-service.js';

// localhost does not support the __Host prefix and should be scoped to port
function getRefreshCookieName(context: RequestServiceContext): string {
  if (config.APP_ENVIRONMENT !== 'development') {
    return '__Host-auth_refresh_token';
  }
  // use referer to determine hostname because React reverse proxies use referer to signal the original host
  const { referer } = context.reqInfo.headers;
  const port = referer ? new URL(referer).port : config.SERVER_PORT;
  return `auth-refresh-token-${port}`;
}

export function getRefreshTokenFromCookie(
  context: RequestServiceContext,
): string | undefined {
  const cookieName = getRefreshCookieName(context);
  return context.cookieStore.get(cookieName);
}

export function setRefreshTokenIntoCookie(
  context: RequestServiceContext,
  refreshToken: string,
): void {
  const cookieName = getRefreshCookieName(context);
  context.cookieStore.set(cookieName, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}

export function clearRefreshTokenFromCookie(
  context: RequestServiceContext,
): void {
  const cookieName = getRefreshCookieName(context);
  context.cookieStore.clear(cookieName);
}

export function formatRefreshTokens(
  context: RequestServiceContext,
  payload: AuthPayload,
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
