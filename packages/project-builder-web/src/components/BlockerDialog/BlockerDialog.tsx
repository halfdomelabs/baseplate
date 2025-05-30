import type React from 'react';

import { useBlockerDialogState } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@halfdomelabs/ui-components';
import { useCallback, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';

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

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !!activeBlocker && currentLocation.pathname !== nextLocation.pathname,
  );

  const [isContinuing, setIsContinuing] = useState(false);

  const resetBlockers = useCallback(() => {
    blocker.reset?.();
    clearRequestedBlockers();
  }, [blocker, clearRequestedBlockers]);

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
        if (blocker.state === 'blocked') {
          blocker.proceed();
        }
        for (const request of requestedBlockers) request.onContinue();
        clearRequestedBlockers();
      } finally {
        setIsContinuing(false);
      }
    },
    [blocker, requestedBlockers, clearRequestedBlockers, resetBlockers],
  );

  const shouldShowBlocker =
    blocker.state === 'blocked' || requestedBlockers.length > 0;

  useEffect(() => {
    if (shouldShowBlocker && !activeBlocker && !isContinuing) {
      continueBlockers().catch((error: unknown) => {
        logError(error);
      });
    }
  }, [shouldShowBlocker, continueBlockers, activeBlocker, isContinuing]);

  const cancelButton = (
    <Button onClick={resetBlockers} variant="secondary">
      Cancel
    </Button>
  );

  const continueWithoutSaveButton =
    activeBlocker?.buttonContinueWithoutSaveText && (
      <Button
        onClick={() =>
          continueBlockers(activeBlocker.onContinueWithoutSave).catch(
            (error: unknown) => {
              logError(error);
            },
          )
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
