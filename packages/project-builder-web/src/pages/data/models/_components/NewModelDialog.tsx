import type React from 'react';

import { useBlockBeforeContinue } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dialog,
  useControlledState,
} from '@halfdomelabs/ui-components';

import { useModelForm } from '../_hooks/useModelForm';
import { ModelInfoForm } from '../edit/_components/ModelInfoForm';

interface NewModelDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewModelDialog({
  children,
  open,
  onOpenChange,
}: NewModelDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const {
    onSubmit,
    form: { control },
  } = useModelForm({
    isCreate: true,
    onSubmitSuccess: () => {
      setIsOpen(false);
    },
  });

  const blockBeforeContinue = useBlockBeforeContinue();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(shouldOpen) => {
        if (shouldOpen) {
          blockBeforeContinue({
            onContinue: () => {
              setIsOpen(true);
            },
          });
        } else {
          setIsOpen(false);
        }
      }}
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>New Model</Dialog.Title>
          <Dialog.Description>
            Models define the structure of your data.
          </Dialog.Description>
        </Dialog.Header>
        <form onSubmit={onSubmit} className="space-y-4">
          <ModelInfoForm control={control} />
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Create Model</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
