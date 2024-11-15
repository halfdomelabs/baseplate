import type React from 'react';

import { useBlockBeforeContinue } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dialog,
  SwitchField,
  useControlledState,
} from '@halfdomelabs/ui-components';

import { EnumInfoForm } from '../components/EnumInfoForm';
import { useEnumForm } from '../hooks/useEnumForm';

interface NewEnumDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewEnumDialog({
  children,
  open,
  onOpenChange,
}: NewEnumDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const {
    onSubmit,
    form: { control },
  } = useEnumForm({
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
          <Dialog.Title>New Enum</Dialog.Title>
          <Dialog.Description>
            Enums are a list of values that can be used in your data models.
          </Dialog.Description>
        </Dialog.Header>
        <form onSubmit={onSubmit} className="space-y-4">
          <EnumInfoForm control={control} />
          <SwitchField.Controller
            label="Expose in GraphQL schema"
            control={control}
            name="isExposed"
            description="Whether to expose this enum in the GraphQL schema"
          />
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Create Enum</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
