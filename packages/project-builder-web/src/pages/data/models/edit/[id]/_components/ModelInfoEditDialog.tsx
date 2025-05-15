import type React from 'react';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useControlledState,
} from '@halfdomelabs/ui-components';

import { useModelForm } from '@src/pages/data/models/_hooks/useModelForm';

import { ModelInfoForm } from './ModelInfoForm';

interface ModelInfoEditDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  asChild?: boolean;
}

export function ModelInfoEditDialog({
  open,
  onOpenChange,
  children,
  asChild,
}: ModelInfoEditDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);

  const {
    form: { control, reset },
    onSubmit,
    defaultValues,
  } = useModelForm({
    onSubmitSuccess() {
      setIsOpen(false);
    },
  });
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(newOpen) => {
        setIsOpen(newOpen);
        if (!newOpen) {
          reset(defaultValues);
        }
      }}
    >
      {children && <DialogTrigger asChild={asChild}>{children}</DialogTrigger>}
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Model Info</DialogTitle>
          </DialogHeader>
          <ModelInfoForm control={control} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
