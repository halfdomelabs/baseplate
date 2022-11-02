/**
 * SafeLocalStorage is a wrapper around localStorage that will
 * fallback to an in-memory store if localStorage is not available, e.g.
 * if cookies are disabled on Safari.
 */

interface SafeLocalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// adapted from https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js#L38
function isLocalStorageEnabled(): boolean {
  const TEST_KEY = 'local_storage_test';
  try {
    localStorage.setItem(TEST_KEY, TEST_KEY);
    localStorage.removeItem(TEST_KEY);
    return true;
  } catch (e) {
    return false;
  }
}

function createSafeLocalStorage(): SafeLocalStorage {
  if (isLocalStorageEnabled()) {
    return localStorage;
  }
  const store: Record<string, string> = {};
  return {
    getItem(key) {
      return store[key] ?? null;
    },
    setItem(key, value) {
      store[key] = value;
    },
    removeItem(key) {
      delete store[key];
    },
  };
}

let cachedLocalStorage: SafeLocalStorage | null = null;

export function getSafeLocalStorage(): SafeLocalStorage {
  if (cachedLocalStorage === null) {
    cachedLocalStorage = createSafeLocalStorage();
  }
  return cachedLocalStorage;
}
