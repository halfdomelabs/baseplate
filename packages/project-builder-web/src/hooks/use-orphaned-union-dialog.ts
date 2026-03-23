import type { OrphanedUnionItem } from '@baseplate-dev/project-builder-lib';

import { useMemo } from 'react';
import { create } from 'zustand';

interface UseOrphanedUnionDialogRequestOptions {
  items: OrphanedUnionItem[];
}

interface UseOrphanedUnionDialogResult {
  showOrphanedUnionIssues: (
    request: UseOrphanedUnionDialogRequestOptions,
  ) => void;
  clearOrphanedUnionIssues: () => void;
}

interface UseOrphanedUnionDialogState {
  dialogOptions?: UseOrphanedUnionDialogRequestOptions;
  setDialogOptions: (
    options: UseOrphanedUnionDialogRequestOptions | undefined,
  ) => void;
}

export const useOrphanedUnionDialogState = create<UseOrphanedUnionDialogState>(
  (set) => ({
    dialogOptions: undefined,
    setDialogOptions: (options) => {
      set({ dialogOptions: options });
    },
  }),
);

export function useOrphanedUnionDialog(): UseOrphanedUnionDialogResult {
  const setDialogOptions = useOrphanedUnionDialogState(
    (state) => state.setDialogOptions,
  );

  return useMemo(
    () => ({
      showOrphanedUnionIssues: (request) => {
        setDialogOptions(request);
      },
      clearOrphanedUnionIssues: () => {
        setDialogOptions(undefined);
      },
    }),
    [setDialogOptions],
  );
}
