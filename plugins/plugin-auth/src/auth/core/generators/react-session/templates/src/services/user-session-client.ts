// @ts-nocheck

import { getSafeLocalStorage } from '%reactUtilsImports';

/**
 * Session data returned by the user session client
 */
export interface UserSessionData {
  userId: string;
}

/**
 * Callback function for session change events
 */
export type SessionChangeCallback = (
  session: UserSessionData | undefined,
) => void;

/**
 * Configuration options for creating the user session client
 */
export interface UserSessionClientConfig {
  /**
   * Optional initial session data
   */
  initialSession?: UserSessionData;
}

/**
 * User session client for managing session persistence using localStorage
 * Handles session state persistence and cross-tab synchronization
 */
export class UserSessionClient {
  private static readonly USER_ID_STORAGE_KEY = 'APP_USER_ID';
  private readonly storage = getSafeLocalStorage();
  private readonly callbacks = new Set<SessionChangeCallback>();
  private cleanupListener?: () => void;

  constructor(config?: UserSessionClientConfig) {
    // Initialize storage listener for cross-tab synchronization
    this.setupStorageListener();

    // Set initial session if provided
    if (config?.initialSession?.userId) {
      this.setUserId(config.initialSession.userId);
    }
  }

  /**
   * Get the current session data
   * @returns Current session information
   */
  getSession(): UserSessionData | undefined {
    const userId = this.getUserId();
    return userId ? { userId } : undefined;
  }

  /**
   * Sign in a user with the given user ID
   * @param userId - The user ID to sign in
   */
  signIn(userId: string): void {
    this.setUserId(userId);
    this.notifyCallbacks();
  }

  /**
   * Sign out the current user
   */
  signOut(): void {
    this.setUserId(null);
    this.notifyCallbacks();
  }

  /**
   * Subscribe to session changes
   * @param callback - Function to call when session changes
   * @returns Cleanup function to unsubscribe
   */
  onSessionChange(callback: SessionChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Clean up resources when the client is no longer needed
   */
  destroy(): void {
    this.cleanupListener?.();
    this.callbacks.clear();
  }

  /**
   * Get the current user ID from storage
   * @returns User ID or null if not authenticated
   */
  private getUserId(): string | null {
    return this.storage.getItem(UserSessionClient.USER_ID_STORAGE_KEY);
  }

  /**
   * Set the user ID in storage
   * @param userId - User ID to store, or null to clear
   */
  private setUserId(userId: string | null): void {
    const currentUserId = this.getUserId();
    const userIdChanged = userId !== currentUserId;

    if (!userIdChanged) {
      return;
    }

    if (userId) {
      this.storage.setItem(UserSessionClient.USER_ID_STORAGE_KEY, userId);
    } else {
      this.storage.removeItem(UserSessionClient.USER_ID_STORAGE_KEY);
    }
  }

  /**
   * Set up storage listener for cross-tab synchronization
   */
  private setupStorageListener(): void {
    this.cleanupListener = this.storage.addEventListener((key) => {
      if (key === UserSessionClient.USER_ID_STORAGE_KEY) {
        this.notifyCallbacks();
      }
    });
  }

  /**
   * Notify all registered callbacks of session changes
   */
  private notifyCallbacks(): void {
    const session = this.getSession();
    for (const callback of this.callbacks) {
      callback(session);
    }
  }
}

/**
 * Factory function to create a user session client
 * @param config - Optional configuration for the client
 * @returns New UserSessionClient instance
 */
export function createUserSessionClient(
  config?: UserSessionClientConfig,
): UserSessionClient {
  return new UserSessionClient(config);
}
