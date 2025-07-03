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
} from '@baseplate-dev/ui-components';

import { useModelForm } from '../../-hooks/use-model-form.js';
import { ModelInfoForm } from './model-info-form.js';

interface ModelInfoEditDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  asChild?: boolean;
  modelKey: string;
}

export function ModelInfoEditDialog({
  open,
  onOpenChange,
  children,
  asChild,
  modelKey,
}: ModelInfoEditDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);

  const {
    form: { control, reset },
    onSubmit,
    defaultValues,
  } = useModelForm({
    modelKey,
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
