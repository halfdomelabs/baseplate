import { useRef } from 'react';
import { COMPONENT_STRINGS } from '@src/constants/strings.js';
import {
  UseConfirmDialogRequestOptions,
  useConfirmDialogState,
} from '@src/hooks/useConfirmDialog.js';
import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';

/**
 * A confirm dialog that is placed alongside pages rooted at the top level.
 *
 * This enables the use of the useConfirmDialog hook.
 */
export function ConfirmDialogPopper(): JSX.Element {
  const { confirmOptions, setConfirmOptions } = useConfirmDialogState();

  // We need to store the options in a ref because the Dialog component
  // will transition to fade so we need to cache the text while we close.
  const textOptions = useRef<null | Partial<
    Omit<UseConfirmDialogRequestOptions, 'onSubmit'>
  >>();
  const { title, message, onSubmit, confirmText } = confirmOptions || {};
  if (confirmOptions) {
    textOptions.current = { title, message, confirmText };
  }

  return (
    <Dialog
      isOpen={!!confirmOptions}
      onOpenChange={() => setConfirmOptions(undefined)}
    >
      <Dialog.Header>
        <Dialog.Title>{textOptions.current?.title}</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>
        <p>{textOptions.current?.message}</p>
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          variant="secondary"
          onClick={() => setConfirmOptions(undefined)}
        >
          {COMPONENT_STRINGS.cancelButton}
        </Button>
        <Button onClick={onSubmit}>
          {textOptions.current?.confirmText || COMPONENT_STRINGS.confirmButton}
        </Button>
      </Dialog.Footer>
    </Dialog>
  );
}
