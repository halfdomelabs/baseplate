import type React from 'react';

import { useBlockBeforeContinue } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  SwitchFieldController,
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
    isSavingDefinition,
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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Enum</DialogTitle>
          <DialogDescription>
            Enums are a list of values that can be used in your data models.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <EnumInfoForm control={control} />
          <SwitchFieldController
            label="Expose in GraphQL schema"
            control={control}
            name="isExposed"
            description="Whether to expose this enum in the GraphQL schema"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSavingDefinition}>
              Create Enum
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
