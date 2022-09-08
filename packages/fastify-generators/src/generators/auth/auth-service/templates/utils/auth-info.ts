// @ts-nocheck

export interface UserInfo {
  id: string;
  email: string;
  tokenExpiry?: Date;
}

export interface AuthInfo {
  AUTH_TYPE;
}

export function createAuthInfoFromUser(
  user: UserInfo | null,
  EXTRA_ARGS
): AuthInfo {
  return AUTH_OBJECT;
}
