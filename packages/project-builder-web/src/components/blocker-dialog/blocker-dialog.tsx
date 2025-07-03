import type React from 'react';

import { useBlockerDialogState } from '@baseplate-dev/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@baseplate-dev/ui-components';
import { useBlocker } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';

import { logError } from '#src/services/error-logger.js';

/**
 * A blocker dialog that is placed at the top level of the page
 * enabling the use of the useBlockerDialog hook.
 */
export function BlockerDialog(): React.JSX.Element {
  const activeBlocker = useBlockerDialogState((state) =>
    state.activeBlockers.length > 0 ? state.activeBlockers[0] : null,
  );
  const requestedBlockers = useBlockerDialogState(
    (state) => state.requestedBlockers,
  );
  const clearRequestedBlockers = useBlockerDialogState(
    (state) => state.clearRequestedBlockers,
  );

  const { proceed, reset, status } = useBlocker({
    enableBeforeUnload: false,
    shouldBlockFn: () =>
      useBlockerDialogState.getState().activeBlockers.length > 0,
    withResolver: true,
  });

  const [isContinuing, setIsContinuing] = useState(false);

  const resetBlockers = useCallback(() => {
    clearRequestedBlockers();
    reset?.();
  }, [reset, clearRequestedBlockers]);

  const continueBlockers = useCallback(
    async (
      continueCallback?: () => Promise<boolean> | boolean,
    ): Promise<void> => {
      setIsContinuing(true);
      try {
        if (continueCallback) {
          const shouldContinue = await continueCallback();
          if (!shouldContinue) {
            resetBlockers();
            return;
          }
        }
        if (status === 'blocked') {
          proceed();
        }
        for (const request of requestedBlockers) request.onContinue();
        clearRequestedBlockers();
      } finally {
        setIsContinuing(false);
      }
    },
    [status, proceed, requestedBlockers, clearRequestedBlockers, resetBlockers],
  );

  const shouldShowBlocker =
    status === 'blocked' || requestedBlockers.length > 0;

  useEffect(() => {
    if (shouldShowBlocker && !activeBlocker && !isContinuing) {
      proceed?.();
    }
  }, [shouldShowBlocker, proceed, activeBlocker, isContinuing]);

  const cancelButton = (
    <Button onClick={resetBlockers} variant="secondary">
      Cancel
    </Button>
  );

  const continueWithoutSaveButton =
    activeBlocker?.buttonContinueWithoutSaveText && (
      <Button
        onClick={() =>
          continueBlockers(activeBlocker.onContinueWithoutSave).catch(logError)
        }
        disabled={isContinuing}
        variant="secondary"
      >
        {activeBlocker.buttonContinueWithoutSaveText ??
          'Continue without saving'}
      </Button>
    );

  const continueButton = (
    <Button
      disabled={isContinuing}
      onClick={() => {
        continueBlockers(activeBlocker?.onContinue).catch((error: unknown) => {
          logError(error);
        });
      }}
    >
      {activeBlocker?.buttonContinueText ?? 'Continue'}
    </Button>
  );

  return (
    <Dialog
      open={shouldShowBlocker}
      onOpenChange={(open) => {
        if (!open) {
          resetBlockers();
        }
      }}
    >
      <DialogContent>
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle>{activeBlocker?.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription>{activeBlocker?.content}</DialogDescription>
          <DialogFooter>
            {continueWithoutSaveButton ? (
              <div className="flex w-full justify-between">
                {continueWithoutSaveButton}
                <div className="space-x-2">
                  {cancelButton}
                  {continueButton}
                </div>
              </div>
            ) : (
              <>
                {cancelButton}
                {continueButton}
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
