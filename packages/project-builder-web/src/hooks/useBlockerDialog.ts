import { useEffect, useId } from 'react';
import { create } from 'zustand';

export interface UseBlockerDialogOptions {
  disableBlock?: boolean;
  title: string;
  content: string;
  buttonCancelText?: string;
  buttonContinueText?: string;
}

interface UseBlockerDialogOptionsWithId extends UseBlockerDialogOptions {
  id: string;
}

interface UseBlockerDialogState {
  activeBlockers: UseBlockerDialogOptionsWithId[];
  addBlocker: (options: UseBlockerDialogOptionsWithId) => void;
  removeBlocker: (id: string) => void;
}

export const useBlockerDialogState = create<UseBlockerDialogState>((set) => ({
  activeBlockers: [],
  addBlocker: (options) => {
    set((state) => ({
      activeBlockers: [...state.activeBlockers, options],
    }));
  },
  removeBlocker: (id) => {
    set((state) => ({
      activeBlockers: state.activeBlockers.filter(
        (blocker) => blocker.id !== id,
      ),
    }));
  },
}));

export function useBlockerDialog(options: UseBlockerDialogOptions): void {
  const id = useId();

  const { addBlocker, removeBlocker } = useBlockerDialogState();

  useEffect(() => {
    if (options.disableBlock) {
      return;
    }
    addBlocker({
      disableBlock: options.disableBlock,
      title: options.title,
      content: options.content,
      buttonCancelText: options.buttonCancelText,
      buttonContinueText: options.buttonContinueText,
      id,
    });
    return () => {
      removeBlocker(id);
    };
  }, [
    addBlocker,
    removeBlocker,
    options.disableBlock,
    options.buttonCancelText,
    options.buttonContinueText,
    options.content,
    options.title,
    id,
  ]);
}
