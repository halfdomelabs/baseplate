import { useEffect, useId } from 'react';
import { create } from 'zustand';

export interface UseBlockerDialogOptions {
  disableBlock?: boolean;
  title: string;
  content: string;
  /**
   * Text for button enabling the user to continue without saving (discarding changes). If blank, no button with show.
   */
  buttonContinueWithoutSaveText?: string;
  /**
   * Action handler for when the user clicks the continue without saving button
   *
   * @returns true if the user should be allowed to continue, false if the user should be blocked from continuing
   */
  onContinueWithoutSave?: () => Promise<boolean> | boolean;
  /**
   * Text for button enabling the user to continue
   */
  buttonContinueText?: string;
  /**
   * Action handler for when the user clicks the continue button
   *
   * @returns true if the user should be allowed to continue, false if the user should be blocked from continuing
   */
  onContinue?: () => Promise<boolean> | boolean;
}

interface UseBlockerDialogOptionsWithId extends UseBlockerDialogOptions {
  id: string;
}

interface RequestBlockerOptions {
  onContinue: () => void;
}

interface UseBlockerDialogState {
  activeBlockers: UseBlockerDialogOptionsWithId[];
  addBlocker: (options: UseBlockerDialogOptionsWithId) => void;
  removeBlocker: (id: string) => void;
  requestedBlockers: RequestBlockerOptions[];
  requestBlocker: (options: RequestBlockerOptions) => void;
  clearRequestedBlockers: () => void;
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
  requestedBlockers: [],
  requestBlocker(options) {
    set((state) => ({
      requestedBlockers: [...state.requestedBlockers, options],
    }));
  },
  clearRequestedBlockers: () => {
    set(() => ({
      requestedBlockers: [],
    }));
  },
}));

export function useBlockBeforeContinue(): (
  options: RequestBlockerOptions,
) => void {
  const hasActiveBlockers = useBlockerDialogState(
    (state) => !!state.activeBlockers.length,
  );
  const clearRequestedBlockers = useBlockerDialogState(
    (state) => state.clearRequestedBlockers,
  );
  // make sure we clear any blocker requests if we navigate away
  useEffect(() => {
    return () => {
      clearRequestedBlockers();
    };
  }, []);
  const requestBlocker = useBlockerDialogState((state) => state.requestBlocker);
  // if no blockers, continue immediately
  if (!hasActiveBlockers) {
    return ({ onContinue }) => {
      onContinue();
    };
  }
  return requestBlocker;
}

export function useBlockerDialog(options: UseBlockerDialogOptions): void {
  const id = useId();

  const addBlocker = useBlockerDialogState((state) => state.addBlocker);
  const removeBlocker = useBlockerDialogState((state) => state.removeBlocker);

  useEffect(() => {
    if (options.disableBlock) {
      return;
    }
    addBlocker({
      disableBlock: options.disableBlock,
      title: options.title,
      content: options.content,
      buttonContinueWithoutSaveText: options.buttonContinueWithoutSaveText,
      onContinueWithoutSave: options.onContinueWithoutSave,
      buttonContinueText: options.buttonContinueText,
      onContinue: options.onContinue,
      id,
    });
    return () => {
      removeBlocker(id);
    };
  }, [
    addBlocker,
    removeBlocker,
    options.disableBlock,
    options.buttonContinueWithoutSaveText,
    options.onContinueWithoutSave,
    options.buttonContinueText,
    options.content,
    options.title,
    options.onContinue,
    id,
  ]);
}
