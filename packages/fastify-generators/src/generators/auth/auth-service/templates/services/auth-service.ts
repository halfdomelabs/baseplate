// @ts-nocheck
import { JwtPayload } from 'jsonwebtoken';
import ms from 'ms';
import { jwtService, InvalidTokenError } from './jwt-service';

export interface AuthPayload {
  userId: string;
  refreshToken: string;
  accessToken: string;
}

interface AuthJwtPayload extends JwtPayload {
  type: 'access' | 'refresh';
  sub: string;
}

export const ACCESS_TOKEN_EXPIRY_SECONDS = ms(ACCESS_TOKEN_EXPIRY_TIME) / 1000;
export const REFRESH_TOKEN_EXPIRY_SECONDS =
  ms(REFRESH_TOKEN_EXPIRY_TIME) / 1000;

async function issueUserAuthPayload(userId: string): Promise<AuthPayload> {
  const accessToken = await jwtService.sign<AuthJwtPayload>(
    { sub: userId, type: 'access' },
    ACCESS_TOKEN_EXPIRY_SECONDS
  );
  const refreshToken = await jwtService.sign<AuthJwtPayload>(
    { sub: userId, type: 'refresh' },
    REFRESH_TOKEN_EXPIRY_SECONDS
  );
  return { userId, refreshToken, accessToken };
}

/**
 * check if refresh token was issued after user tokensNotBefore
 * JWTs without an IAT are considered invalid
 */
function isJwtIssueDateValid(
  payload: JwtPayload,
  notBefore: Date | null
): boolean {
  if (!notBefore) {
    return true;
  }
  return !payload.iat || payload.iat * 1000 < notBefore.getTime();
}

export const authService = {
  async login(userId: string): Promise<AuthPayload> {
    const payload = await issueUserAuthPayload(userId);
    return payload;
  },
  async refreshToken(
    userId: string,
    refreshToken: string
  ): Promise<AuthPayload> {
    const user = await USER_MODEL.findUnique({
      where: { USER_ID_NAME: userId },
    });

    if (!user) {
      throw new InvalidTokenError();
    }
    const payload = await jwtService.verify<AuthJwtPayload>(refreshToken);

    if (payload.type !== 'refresh') {
      throw new InvalidTokenError('Must be provided refresh token');
    }

    if (payload.sub !== user.id) {
      throw new InvalidTokenError('Refresh token does not match user ID');
    }

    if (!isJwtIssueDateValid(payload, user.tokensNotBefore)) {
      throw new InvalidTokenError('Refresh token has been invalidated');
    }

    return issueUserAuthPayload(user.id);
  },
  async getUserFromToken(accessToken: string): Promise<AUTH_USER> {
    const payload = await jwtService.verify<AuthJwtPayload>(accessToken);

    if (payload.type !== 'access') {
      throw new InvalidTokenError('JWT token is not an access token');
    }

    const user = await USER_MODEL.findUnique(AUTH_USER_QUERY_PARMS);

    if (!user) {
      throw new InvalidTokenError('User not found');
    }

    if (!isJwtIssueDateValid(payload, user.tokensNotBefore)) {
      throw new InvalidTokenError('Access token has been invalidated');
    }

    return user;
  },
};
