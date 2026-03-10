import type { DefinitionIssue } from '@baseplate-dev/project-builder-lib';

import { useMemo } from 'react';
import { create } from 'zustand';

interface DefinitionWarningDialogOptions {
  warnings: DefinitionIssue[];
}

interface DefinitionWarningDialogState {
  dialogOptions?: DefinitionWarningDialogOptions;
  setDialogOptions: (
    options: DefinitionWarningDialogOptions | undefined,
  ) => void;
}

export const useDefinitionWarningDialogState =
  create<DefinitionWarningDialogState>((set) => ({
    dialogOptions: undefined,
    setDialogOptions: (options) => {
      set({ dialogOptions: options });
    },
  }));

interface UseDefinitionWarningDialogResult {
  showWarnings: (options: DefinitionWarningDialogOptions) => void;
}

export function useDefinitionWarningDialog(): UseDefinitionWarningDialogResult {
  const setDialogOptions = useDefinitionWarningDialogState(
    (state) => state.setDialogOptions,
  );

  return useMemo(
    () => ({
      showWarnings: (options) => {
        setDialogOptions(options);
      },
    }),
    [setDialogOptions],
  );
}
