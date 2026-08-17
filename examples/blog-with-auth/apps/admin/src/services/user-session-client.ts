import type { AuthRole } from '../gql/graphql';
import type { SessionData } from '../hooks/use-session';

import { getSafeLocalStorage } from '../utils/safe-local-storage';

/**
 * Callback function for session change events
 */
type SessionChangeCallback = () => void;

const USER_ID_STORAGE_KEY = 'APP_USER_ID';

const PUBLIC_SESSION: SessionData = {
  userId: undefined,
  isAuthenticated: false,
  roles: ['public'],
  isPending: false,
};

function areSessionsEqual(a: SessionData, b: SessionData): boolean {
  return (
    a.userId === b.userId &&
    a.isPending === b.isPending &&
    a.roles.length === b.roles.length &&
    a.roles.every((role, idx) => role === b.roles[idx])
  );
}

export interface UserSessionClient {
  /**
   * Get the current session, or `undefined` if it is not known yet.
   *
   * Returns a stable reference that only changes when the session itself changes,
   * so it is safe to use as a `useSyncExternalStore` snapshot.
   */
  getSession: () => SessionData | undefined;
  /**
   * Subscribe to session changes
   * @param callback - Function to call when the session changes
   * @returns Cleanup function to unsubscribe
   */
  subscribe: (callback: SessionChangeCallback) => () => void;
  /**
   * Sign in a user with a session the server has already returned
   * @param userId - The user ID to sign in
   * @param roles - The roles the server issued alongside the session
   */
  signIn: (userId: string, roles: AuthRole[]) => void;
  /**
   * Sign out the current user
   */
  signOut: () => void;
  /**
   * Apply the session reported by the server, confirming or replacing whatever was
   * published locally
   * @param session - The session from the server, or undefined if signed out
   */
  setServerSession: (
    session: { userId: string; roles: AuthRole[] } | undefined,
  ) => void;
  /**
   * Get the user ID persisted in storage, which may not be confirmed yet
   * @returns User ID or undefined if not signed in
   */
  getPersistedUserId: () => string | undefined;
  /**
   * Clean up resources when the client is no longer needed
   */
  destroy: () => void;
}

/**
 * Creates the client-side source of truth for the current user session.
 *
 * The session is published synchronously when it is known locally (sign in / sign
 * out) and refined asynchronously when the server confirms it. It is deliberately
 * not derived from the Apollo cache, since signing in clears that cache.
 *
 * The user ID is persisted to localStorage for cold starts and cross-tab
 * synchronisation. Roles are never persisted — they are only ever trusted from the
 * server, and are enforced there regardless.
 */
export function createUserSessionClient(): UserSessionClient {
  const storage = getSafeLocalStorage();
  const callbacks = new Set<SessionChangeCallback>();

  function getPersistedUserId(): string | undefined {
    return storage.getItem(USER_ID_STORAGE_KEY) ?? undefined;
  }

  // A persisted user ID means we expect a session, so hold off publishing until the
  // server confirms it. With no persisted user ID there is nothing to wait for and
  // the public session can be published immediately.
  let session: SessionData | undefined = getPersistedUserId()
    ? undefined
    : PUBLIC_SESSION;

  function publish(newSession: SessionData): void {
    if (session && areSessionsEqual(session, newSession)) {
      return;
    }
    session = newSession;
    for (const callback of callbacks) {
      callback();
    }
  }

  function persistUserId(userId: string | undefined): void {
    if (userId === getPersistedUserId()) {
      return;
    }

    if (userId) {
      storage.setItem(USER_ID_STORAGE_KEY, userId);
    } else {
      storage.removeItem(USER_ID_STORAGE_KEY);
    }
  }

  function signIn(userId: string, roles: AuthRole[]): void {
    publish({
      userId,
      isAuthenticated: true,
      roles,
      isPending: false,
    });
    persistUserId(userId);
  }

  function signOut(): void {
    publish(PUBLIC_SESSION);
    persistUserId(undefined);
  }

  const cleanupListener = storage.addEventListener((key, newValue) => {
    if (key !== USER_ID_STORAGE_KEY) {
      return;
    }

    const userId = newValue ?? undefined;
    // Writes from this tab publish the session themselves before persisting it, so
    // anything already matching is our own write echoing back. A session that is
    // not known yet never matches, since no session has been published.
    if (session && userId === session.userId) {
      return;
    }

    // Another tab changed the identity. Publish it right away so we never render
    // one user's identity with another's data, with roles marked pending until the
    // server confirms them.
    publish(
      userId
        ? { userId, isAuthenticated: true, roles: [], isPending: true }
        : PUBLIC_SESSION,
    );
  });

  return {
    getSession: () => session,
    subscribe(callback) {
      callbacks.add(callback);
      return () => {
        callbacks.delete(callback);
      };
    },
    signIn,
    signOut,
    setServerSession(serverSession) {
      if (serverSession) {
        signIn(serverSession.userId, serverSession.roles);
      } else {
        signOut();
      }
    },
    getPersistedUserId,
    destroy() {
      cleanupListener();
      callbacks.clear();
    },
  };
}

/**
 * Global user session client instance
 */
export const userSessionClient = createUserSessionClient();
