// @ts-nocheck

import ms from 'ms';
import { nanoid } from 'nanoid';
import { getRedisClient } from '%fastify-redis';
import { BadRequestError, UnauthorizedError } from '%http-errors';

const AUTH_CODE_EXPIRY = ms('1 minute');
export const BULL_BOARD_ACCESS_TOKEN_EXPIRY = ms('1 hour');

function getAuthKey(authCode: string): string {
  return `bull-board:auth-code#${authCode}`;
}

export async function createBullBoardAuthCode(): Promise<string> {
  const authCode = nanoid();
  const redis = getRedisClient();

  await redis.set(getAuthKey(authCode), 'true', 'PX', AUTH_CODE_EXPIRY);

  return authCode;
}

function getAccessTokenKey(accessToken: string): string {
  return `bull-board:access-token#${accessToken}`;
}

export async function authenticateBullBoardUser(
  authCode: string,
): Promise<string> {
  const redis = getRedisClient();
  const authKey = getAuthKey(authCode);
  const isAuthCodeValid = await redis.get(authKey);

  if (!isAuthCodeValid) {
    throw new BadRequestError('Invalid auth code');
  }

  const accessToken = nanoid();
  const accessTokenKey = getAccessTokenKey(accessToken);

  await redis.set(accessTokenKey, 'true', 'PX', BULL_BOARD_ACCESS_TOKEN_EXPIRY);

  await redis.del(authKey);

  return accessToken;
}

export async function validateBullBoardAccessToken(
  accessToken: string,
): Promise<void> {
  const redis = getRedisClient();
  const accessTokenKey = getAccessTokenKey(accessToken);
  const isAccessTokenValid = await redis.get(accessTokenKey);

  if (!isAccessTokenValid) {
    throw new UnauthorizedError('Invalid access token');
  }
}
