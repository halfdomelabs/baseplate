import type { FixRefDeletionError } from '@halfdomelabs/project-builder-lib';

import { useMemo } from 'react';
import { create } from 'zustand';

interface UseDeleteReferenceDialogRequestOptions {
  issues: FixRefDeletionError[];
}

interface UseDeleteReferenceDialogResult {
  showRefIssues: (request: UseDeleteReferenceDialogRequestOptions) => void;
  clearRefIssues: () => void;
}

interface UseDeleteReferenceDialogState {
  dialogOptions?: UseDeleteReferenceDialogRequestOptions;
  setDialogOptions: (
    options: UseDeleteReferenceDialogRequestOptions | undefined,
  ) => void;
}

export const useDeleteReferenceDialogState =
  create<UseDeleteReferenceDialogState>((set) => ({
    dialogOptions: undefined,
    setDialogOptions: (options) => {
      set({ dialogOptions: options });
    },
  }));

export function useDeleteReferenceDialog(): UseDeleteReferenceDialogResult {
  const setDialogOptions = useDeleteReferenceDialogState(
    (state) => state.setDialogOptions,
  );

  return useMemo(
    () => ({
      showRefIssues: (request) => {
        setDialogOptions(request);
      },
      clearRefIssues: () => {
        setDialogOptions(undefined);
      },
    }),
    [setDialogOptions],
  );
}
