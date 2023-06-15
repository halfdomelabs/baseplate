import { create } from 'zustand';

export interface UseConfirmDialogRequestOptions {
  title: string;
  message: string;
  confirmText?: string;
  onSubmit: () => void;
}

interface UseConfirmDialogResult {
  requestConfirm: (request: UseConfirmDialogRequestOptions) => void;
}

interface UseConfirmDialogState {
  confirmOptions?: UseConfirmDialogRequestOptions;
  setConfirmOptions: (
    options: UseConfirmDialogRequestOptions | undefined
  ) => void;
}

export const useConfirmDialogState = create<UseConfirmDialogState>((set) => ({
  confirmOptions: undefined,
  setConfirmOptions: (options) => set({ confirmOptions: options }),
}));

export function useConfirmDialog(): UseConfirmDialogResult {
  const state = useConfirmDialogState();

  return {
    requestConfirm: (request) => {
      state.setConfirmOptions(request);
    },
  };
}
