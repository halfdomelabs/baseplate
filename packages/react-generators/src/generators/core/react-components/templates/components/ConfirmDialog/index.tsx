// @ts-nocheck

import type { ReactElement } from 'react';

import * as React from 'react';

import type { UseConfirmDialogRequestOptions } from '../../hooks/useConfirmDialog.js';

import { useConfirmDialogState } from '../../hooks/useConfirmDialog.js';
import Button from '../Button/index.js';
import Modal from '../Modal/index.js';

/**
 * A confirm dialog that is placed at the top level of the page
 * enabling the use of the useConfirmDialog hook.
 */
export function ConfirmDialog(): ReactElement {
  const { confirmOptions, setConfirmOptions } = useConfirmDialogState();

  // We need to store the text content in a ref because the Dialog component
  // will transition to fade so we need to cache the text while we close.
  const textOptionsCached = React.useRef<null | Omit<
    UseConfirmDialogRequestOptions,
    'onConfirm' | 'onCancel'
  >>();

  React.useEffect(() => {
    if (confirmOptions) {
      textOptionsCached.current = {
        title: confirmOptions.title,
        content: confirmOptions.content,
        buttonCancelText: confirmOptions.buttonCancelText,
        buttonConfirmText: confirmOptions.buttonConfirmText,
        buttonConfirmColor: confirmOptions.buttonConfirmColor,
      };
    }
  }, [confirmOptions]);

  const {
    title,
    content,
    onCancel,
    onConfirm,
    buttonCancelText = 'Cancel',
    buttonConfirmText = 'Confirm',
    buttonConfirmColor,
  } = {
    ...textOptionsCached.current,
    ...confirmOptions,
  };

  return (
    <Modal
      isOpen={!!confirmOptions}
      onClose={() => {
        setConfirmOptions(undefined);
      }}
      width="small"
    >
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>{content}</Modal.Body>
      <Modal.Footer>
        <Button
          color="light"
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
          color={buttonConfirmColor}
        >
          {buttonConfirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmDialog;
