// @ts-nocheck
import { ApolloError } from '@apollo/client';
import { getRefreshedAccessToken } from './tokens';
import { AuthPayload } from './types';
import { createTypedEventEmitter } from '%ts-utils/typedEventEmitter';
import { getSafeLocalStorage } from '%react-utils/safeLocalStorage';

interface AuthService {
  destroy(): void;
  isAuthenticated(): boolean;
  getUserId(): string | null;
  getAccessToken(): Promise<string>;
  invalidateAccessToken(): void;
  setAuthPayload(payload: AuthPayload | null): void;
  onUserIdChanged(handler: (payload: string | null) => void): () => void;
}

const USER_ID_KEY = 'AUTH_USER_ID';
const ACCESS_TOKEN_KEY = 'AUTH_ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'AUTH_REFRESH_TOKEN';

const safeLocalStorage = getSafeLocalStorage();

export function createAuthService(): AuthService {
  const events = createTypedEventEmitter<{ userIdChanged: string | null }>();

  const storageEventListener = (e: StorageEvent): void => {
    if (e.key === USER_ID_KEY && e.oldValue !== e.newValue) {
      events.emit('userIdChanged', e.newValue);
    }
  };

  window.addEventListener('storage', storageEventListener);

  function getUserId(): string | null {
    return safeLocalStorage.getItem(USER_ID_KEY);
  }

  function setAuthPayload(payload: AuthPayload | null): void {
    const userIdChanged = payload?.userId !== getUserId();
    if (!payload) {
      safeLocalStorage.removeItem(ACCESS_TOKEN_KEY);
      safeLocalStorage.removeItem(REFRESH_TOKEN_KEY);
      safeLocalStorage.removeItem(USER_ID_KEY);
    } else {
      safeLocalStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
      if (payload.refreshToken) {
        safeLocalStorage.setItem(REFRESH_TOKEN_KEY, payload.refreshToken);
      }
      safeLocalStorage.setItem(USER_ID_KEY, payload.userId);
    }
    if (userIdChanged) {
      events.emit('userIdChanged', null);
    }
  }

  async function renewAccessToken(): Promise<string> {
    const userId = getUserId();
    const refreshToken = safeLocalStorage.getItem(REFRESH_TOKEN_KEY);
    if (!userId) {
      throw new Error('No user ID found');
    }
    try {
      const newPayload = await getRefreshedAccessToken(userId, refreshToken);
      setAuthPayload(newPayload);
      return newPayload.accessToken;
    } catch (err) {
      if (
        err instanceof ApolloError &&
        err.graphQLErrors.some(
          (gqlErr) =>
            gqlErr.extensions?.code === 'invalid-token' ||
            gqlErr.extensions?.code === 'token-expired'
        )
      ) {
        // log us out if the refresh token is invalid
        setAuthPayload(null);
      }
      throw err;
    }
  }

  return {
    destroy() {
      window.removeEventListener('storage', storageEventListener);
    },
    isAuthenticated() {
      return !!getUserId();
    },
    getUserId,
    async getAccessToken() {
      const accessToken = safeLocalStorage.getItem(ACCESS_TOKEN_KEY);
      // Check if access token has been invalidated
      if (!accessToken) {
        return renewAccessToken();
      }
      return accessToken;
    },
    invalidateAccessToken() {
      safeLocalStorage.setItem(ACCESS_TOKEN_KEY, '');
    },
    setAuthPayload,
    onUserIdChanged(handler) {
      return events.on('userIdChanged', handler);
    },
  };
}

export const authService = createAuthService();
