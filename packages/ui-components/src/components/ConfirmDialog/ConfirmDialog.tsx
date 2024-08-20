import { useEffect, useRef } from 'react';

import { Button } from '../Button/Button.js';
import { Dialog } from '../Dialog/Dialog.js';
import { useComponentStrings } from '@src/contexts/ComponentStrings.js';
import {
  UseConfirmDialogRequestOptions,
  useConfirmDialogState,
} from '@src/hooks/useConfirmDialog.js';

/**
 * A confirm dialog that is placed at the top level of the page
 * enabling the use of the useConfirmDialog hook.
 */
export function ConfirmDialog(): JSX.Element {
  const { confirmOptions, setConfirmOptions } = useConfirmDialogState();
  const strings = useComponentStrings();

  // We need to store the text content in a ref because the Dialog component
  // will transition to fade so we need to cache the text while we close.
  const textOptionsCached = useRef<null | Omit<
    UseConfirmDialogRequestOptions,
    'onConfirm' | 'onCancel'
  >>();

  useEffect(() => {
    if (confirmOptions) {
      textOptionsCached.current = {
        title: confirmOptions.title,
        content: confirmOptions.content,
        buttonCancelText: confirmOptions.buttonCancelText,
        buttonConfirmText: confirmOptions.buttonConfirmText,
        buttonConfirmVariant: confirmOptions.buttonConfirmVariant,
      };
    }
  }, [confirmOptions]);

  const {
    title,
    content,
    onCancel,
    onConfirm,
    buttonCancelText = strings.buttonCancel,
    buttonConfirmText = strings.buttonConfirm,
    buttonConfirmVariant,
  } = {
    ...textOptionsCached.current,
    ...confirmOptions,
  };

  return (
    <Dialog
      open={!!confirmOptions}
      onOpenChange={() => setConfirmOptions(undefined)}
    >
      <Dialog.Content width="md">
        <Dialog.Header>
          <Dialog.Title>{title}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Description>{content}</Dialog.Description>
        <Dialog.Footer>
          <Button
            variant="secondary"
            onClick={(e) => {
              onCancel?.(e);
              if (e.defaultPrevented) return;
              setConfirmOptions(undefined);
            }}
          >
            {buttonCancelText}
          </Button>
          <Button
            onClick={(e) => {
              onConfirm?.(e);
              if (e.defaultPrevented) return;
              setConfirmOptions(undefined);
            }}
            variant={buttonConfirmVariant}
          >
            {buttonConfirmText}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
