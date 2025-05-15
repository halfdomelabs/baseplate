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
  useControlledState,
} from '@halfdomelabs/ui-components';

import { useModelForm } from '../_hooks/useModelForm';
import { ModelInfoForm } from '../edit/[id]/_components/ModelInfoForm';

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
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Model</DialogTitle>
          <DialogDescription>
            Models define the structure of your data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <ModelInfoForm control={control} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Create Model</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
