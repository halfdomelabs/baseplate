/**
 * Callback function type for storage change events.
 * @param key - The key of the storage item that changed
 * @param newValue - The new value of the storage item (null if item was removed)
 * @param oldValue - The previous value of the storage item (null if item was newly created)
 */
type StorageEventListener = (
  key: string,
  newValue: string | null,
  oldValue: string | null,
) => void;

/**
 * Interface for a storage implementation that provides safe access to localStorage-like functionality
 * with added event listening capabilities. This can be backed by either actual localStorage
 * or an in-memory fallback when localStorage is not available.
 */
interface SafeLocalStorage {
  /**
   * Retrieves the value associated with the given key from storage.
   * @param key - The key to look up in storage
   * @returns The stored value if it exists, null otherwise
   */
  getItem(key: string): string | null;

  /**
   * Stores a value associated with the given key in storage.
   * Triggers event listeners with the old and new values.
   * @param key - The key under which to store the value
   * @param value - The value to store
   */
  setItem(key: string, value: string): void;

  /**
   * Removes the value associated with the given key from storage.
   * Triggers event listeners with the old value and null as the new value.
   * @param key - The key to remove from storage
   */
  removeItem(key: string): void;

  /**
   * Adds an event listener that will be called whenever storage values change.
   * @param listener - The callback function to be called on storage changes
   * @returns A cleanup function that will remove the event listener when called
   */
  addEventListener(listener: StorageEventListener): () => void;

  /**
   * Removes a previously added event listener.
   * @param listener - The callback function to remove from the listeners
   */
  removeEventListener(listener: StorageEventListener): void;
}

/**
 * Checks if localStorage is available and functioning in the current environment.
 * Attempts to write and remove a test key to verify functionality.
 * @returns true if localStorage is available and working, false otherwise
 */
function isLocalStorageEnabled(): boolean {
  const TEST_KEY = 'local_storage_test';
  try {
    localStorage.setItem(TEST_KEY, TEST_KEY);
    localStorage.removeItem(TEST_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * In-memory storage implementation used as a fallback when localStorage is not available.
 * Implements the full SafeLocalStorage interface including event listeners.
 */
class InMemoryStorage implements SafeLocalStorage {
  private store = new Map<string, string>();
  private listeners = new Set<StorageEventListener>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    const oldValue = this.store.get(key);
    this.store.set(key, value);
    this.notifyListeners(key, value, oldValue ?? null);
  }

  removeItem(key: string): void {
    const oldValue = this.store.get(key);
    this.store.delete(key);
    this.notifyListeners(key, null, oldValue ?? null);
  }

  addEventListener(listener: StorageEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.removeEventListener(listener);
    };
  }

  removeEventListener(listener: StorageEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notifies all registered listeners of a storage change.
   * @param key - The key that changed
   * @param newValue - The new value
   * @param oldValue - The previous value
   */
  private notifyListeners(
    key: string,
    newValue: string | null,
    oldValue: string | null,
  ): void {
    for (const listener of this.listeners) listener(key, newValue, oldValue);
  }
}

/**
 * Wrapper around the native localStorage API that adds event listening capabilities
 * and implements the SafeLocalStorage interface.
 */
class LocalStorageWrapper implements SafeLocalStorage {
  private listeners = new Set<StorageEventListener>();

  constructor() {
    // Listen to storage events from other tabs/windows
    globalThis.addEventListener('storage', (event) => {
      if (event.storageArea === localStorage) {
        this.notifyListeners(event.key ?? '', event.newValue, event.oldValue);
      }
    });
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    const oldValue = localStorage.getItem(key);
    localStorage.setItem(key, value);
    // Notify listeners in current window (storage event doesn't fire in the same window)
    this.notifyListeners(key, value, oldValue);
  }

  removeItem(key: string): void {
    const oldValue = localStorage.getItem(key);
    localStorage.removeItem(key);
    this.notifyListeners(key, null, oldValue);
  }

  addEventListener(listener: StorageEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.removeEventListener(listener);
    };
  }

  removeEventListener(listener: StorageEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notifies all registered listeners of a storage change.
   * @param key - The key that changed
   * @param newValue - The new value
   * @param oldValue - The previous value
   */
  private notifyListeners(
    key: string,
    newValue: string | null,
    oldValue: string | null,
  ): void {
    for (const listener of this.listeners) listener(key, newValue, oldValue);
  }
}

/**
 * Creates a new SafeLocalStorage instance.
 * Uses localStorage if available, falls back to in-memory storage if not.
 * @returns A SafeLocalStorage implementation
 */
function createSafeLocalStorage(): SafeLocalStorage {
  return isLocalStorageEnabled()
    ? new LocalStorageWrapper()
    : new InMemoryStorage();
}

let cachedLocalStorage: SafeLocalStorage | null = null;

/**
 * Gets a singleton instance of SafeLocalStorage.
 * The same instance is returned for all calls to this function.
 * @returns A singleton SafeLocalStorage instance
 *
 * @example
 * ```typescript
 * const storage = getSafeLocalStorage();
 *
 * // Add a listener for changes
 * const cleanup = storage.addEventListener((key, newValue, oldValue) => {
 *   console.log(`Storage changed: ${key}`, { newValue, oldValue });
 * });
 *
 * // Store a value
 * storage.setItem('user', 'John');
 *
 * // Retrieve a value
 * const user = storage.getItem('user'); // 'John'
 *
 * // Remove the listener when done
 * cleanup();
 * ```
 */
export function getSafeLocalStorage(): SafeLocalStorage {
  cachedLocalStorage ??= createSafeLocalStorage();
  return cachedLocalStorage;
}
