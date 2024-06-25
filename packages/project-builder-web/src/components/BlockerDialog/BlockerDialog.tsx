import { useBlockerDialogState } from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog } from '@halfdomelabs/ui-components';
import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * A blocker dialog that is placed at the top level of the page
 * enabling the use of the useBlockerDialog hook.
 */
export function BlockerDialog(): JSX.Element {
  const activeBlocker = useBlockerDialogState((state) =>
    state.activeBlockers.length ? state.activeBlockers[0] : null,
  );

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !!activeBlocker && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === 'blocked' && !activeBlocker) {
      blocker.proceed();
    }
  }, [blocker, activeBlocker]);

  return (
    <Dialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open) {
          blocker.reset?.();
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
            <Button onClick={() => blocker.reset?.()} variant="secondary">
              {activeBlocker?.buttonCancelText ?? 'Stay on Page'}
            </Button>
            <Button onClick={() => blocker.proceed?.()}>
              {activeBlocker?.buttonCancelText ?? 'Continue'}
            </Button>
          </Dialog.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}
