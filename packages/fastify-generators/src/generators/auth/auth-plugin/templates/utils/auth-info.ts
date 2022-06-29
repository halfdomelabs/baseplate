// @ts-nocheck

interface UserInfo {
  id: string;
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
