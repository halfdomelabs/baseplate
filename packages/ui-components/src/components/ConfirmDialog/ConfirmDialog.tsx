import type React from 'react';

import { useEffect, useRef } from 'react';

import type { UseConfirmDialogRequestOptions } from '@src/hooks/useConfirmDialog.js';

import { useComponentStrings } from '@src/contexts/component-strings.js';
import { useConfirmDialogState } from '@src/hooks/useConfirmDialog.js';

import { Button } from '../Button/Button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../Dialog/Dialog.js';

/**
 * A confirm dialog that is placed at the top level of the page
 * enabling the use of the useConfirmDialog hook.
 */
export function ConfirmDialog(): React.JSX.Element {
  const { confirmOptions, setConfirmOptions } = useConfirmDialogState();
  const strings = useComponentStrings();

  // We need to store the text content in a ref because the Dialog component
  // will transition to fade so we need to cache the text while we close.
  const textOptionsCached = useRef<null | Omit<
    UseConfirmDialogRequestOptions,
    'onConfirm' | 'onCancel'
  >>(null);

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
      onOpenChange={() => {
        setConfirmOptions(undefined);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogDescription>{content}</DialogDescription>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
