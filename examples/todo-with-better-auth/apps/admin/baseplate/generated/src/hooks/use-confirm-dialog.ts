import { useCallback } from 'react';
import { create } from 'zustand';

import type { ButtonProps } from '../components/ui/button';

export interface UseConfirmDialogRequestOptions {
  title: string;
  content: string;
  buttonCancelText?: string;
  buttonConfirmText?: string;
  buttonConfirmVariant?: ButtonProps['variant'];
  onCancel?: React.MouseEventHandler<HTMLButtonElement>;
  onConfirm?: React.MouseEventHandler<HTMLButtonElement>;
}

interface UseConfirmDialogResult {
  requestConfirm: (request: UseConfirmDialogRequestOptions) => void;
  clearConfirm: () => void;
}

interface UseConfirmDialogState {
  confirmOptions?: UseConfirmDialogRequestOptions;
  setConfirmOptions: (
    options: UseConfirmDialogRequestOptions | undefined,
  ) => void;
}

export const useConfirmDialogState = create<UseConfirmDialogState>((set) => ({
  confirmOptions: undefined,
  setConfirmOptions: (options) => {
    set({ confirmOptions: options });
  },
}));

export function useConfirmDialog(): UseConfirmDialogResult {
  const setConfirmOptions = useConfirmDialogState(
    (state) => state.setConfirmOptions,
  );

  return {
    requestConfirm: useCallback(
      (request) => {
        setConfirmOptions(request);
      },
      [setConfirmOptions],
    ),
    clearConfirm: useCallback(() => {
      setConfirmOptions(undefined);
    }, [setConfirmOptions]),
  };
}
