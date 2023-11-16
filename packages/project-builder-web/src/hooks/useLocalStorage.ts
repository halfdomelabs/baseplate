import { useCallback, useState } from 'react';

const ALLOWED_KEYS = ['saved-app-config'] as const;

export function useLocalStorage(
  key: (typeof ALLOWED_KEYS)[number],
): [string, (value: string) => void] {
  if (!ALLOWED_KEYS.includes(key)) {
    throw new Error(
      `useLocalStorage: key must be one of ${ALLOWED_KEYS.join(', ')}`,
    );
  }

  const [value, setValue] = useState(localStorage.getItem(key) || '');
  const saveValue = useCallback(
    (newValue: string) => {
      setValue(newValue);
      localStorage.setItem(key, newValue);
    },
    [key],
  );
  return [value, saveValue];
}
