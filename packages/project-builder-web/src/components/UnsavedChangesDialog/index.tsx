import { Button, Dialog } from '@halfdomelabs/ui-components';
import { useBlocker } from 'react-router-dom';

import { useDirtyForm } from '@src/hooks/usePreventDirtyForm';

function UnsavedChangesDialog(): JSX.Element {
  const dirtyForm = useDirtyForm();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirtyForm && currentLocation.pathname !== nextLocation.pathname,
  );

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
            <Dialog.Title>Discard Changes?</Dialog.Title>
          </Dialog.Header>
          <Dialog.Description className="flex flex-col gap-2">
            <span>
              You have unsaved changes! Leaving this page will discard any
              changes you&rsquo;ve made.
            </span>
            <span>
              Do you want to leave this page and lose your changes, or stay and
              save them?
            </span>
          </Dialog.Description>
          <Dialog.Footer>
            <Button onClick={() => blocker.reset?.()} variant="secondary">
              Stay on Page
            </Button>
            <Button onClick={() => blocker.proceed?.()}>Discard Changes</Button>
          </Dialog.Footer>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

export default UnsavedChangesDialog;
