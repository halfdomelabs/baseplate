import useLocalStorageState from 'use-local-storage-state';

export function useProjectIdState(): [
  string | undefined,
  (value: string | null) => void
] {
  const [value, setValue, { removeItem }] =
    useLocalStorageState<string>('projectId');
  return [value, (val) => (val ? setValue(val) : removeItem())];
}
