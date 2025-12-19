import { getSafeLocalStorage } from '../utils/safe-local-storage';

/**
 * Callback function for user ID change events
 */
type UserIdChangeCallback = (userId: string | undefined) => void;

/**
 * User session client for managing session persistence using localStorage
 * Handles session state persistence and cross-tab synchronization
 */
export class UserSessionClient {
  private static readonly USER_ID_STORAGE_KEY = 'APP_USER_ID';
  private readonly storage = getSafeLocalStorage();
  private readonly callbacks = new Set<UserIdChangeCallback>();
  private cleanupListener?: () => void;

  constructor() {
    // Initialize storage listener for cross-tab synchronization
    this.setupStorageListener();
  }

  /**
   * Sign in a user with the given user ID
   * @param userId - The user ID to sign in
   */
  signIn(userId: string): void {
    const existingUserId = this.getUserId();
    this.setUserId(userId);
    if (existingUserId !== userId) {
      this.notifyCallbacks();
    }
  }

  /**
   * Sign out the current user
   */
  signOut(): void {
    const existingUserId = this.getUserId();
    this.setUserId(null);
    if (existingUserId) {
      this.notifyCallbacks();
    }
  }

  /**
   * Subscribe to user ID changes
   * @param callback - Function to call when user ID changes
   * @returns Cleanup function to unsubscribe
   */
  onUserIdChange(callback: UserIdChangeCallback): () => void {
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
  getUserId(): string | undefined {
    return (
      this.storage.getItem(UserSessionClient.USER_ID_STORAGE_KEY) ?? undefined
    );
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
    const userId = this.getUserId();
    for (const callback of this.callbacks) {
      callback(userId);
    }
  }
}

/**
 * Global user session client instance
 */
export const userSessionClient = new UserSessionClient();
