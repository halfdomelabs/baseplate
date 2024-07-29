import { useBlockerDialogState } from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog } from '@halfdomelabs/ui-components';
import { useCallback, useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * A blocker dialog that is placed at the top level of the page
 * enabling the use of the useBlockerDialog hook.
 */
export function BlockerDialog(): JSX.Element {
  const activeBlocker = useBlockerDialogState((state) =>
    state.activeBlockers.length ? state.activeBlockers[0] : null,
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

  const continueBlockers = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
    activeBlocker?.onContinue?.();
    requestedBlockers.forEach((request) => request.onContinue());
    clearRequestedBlockers();
  }, [blocker, requestedBlockers, clearRequestedBlockers, activeBlocker]);

  const resetBlockers = useCallback(() => {
    blocker.reset?.();
    clearRequestedBlockers();
  }, [blocker, clearRequestedBlockers]);

  const shouldShowBlocker =
    blocker.state === 'blocked' || requestedBlockers.length > 0;

  useEffect(() => {
    if (shouldShowBlocker && !activeBlocker) {
      continueBlockers();
    }
  }, [shouldShowBlocker, continueBlockers, activeBlocker]);

  return (
    <Dialog
      open={shouldShowBlocker}
      onOpenChange={(open) => {
        if (!open) {
          resetBlockers();
        }
      }}
    >
      <Dialog.Content>
        <div className="space-y-4">
          <Dialog.Header>
            <Dialog.Title>{activeBlocker?.title}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Description>{activeBlocker?.content}</Dialog.Description>
          <Dialog.Footer>
            <Button onClick={resetBlockers} variant="secondary">
              {activeBlocker?.buttonCancelText ?? 'Stay on Page'}
            </Button>
            <Button onClick={continueBlockers}>
              {activeBlocker?.buttonCancelText ?? 'Continue'}
            </Button>
          </Dialog.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
