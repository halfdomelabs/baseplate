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

import { EnumInfoForm } from '../../components/EnumInfoForm';
import { useEnumForm } from '../../hooks/useEnumForm';

interface EnumInfoEditDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  asChild?: boolean;
}

export function EnumInfoEditDialog({
  open,
  onOpenChange,
  asChild,
  children,
}: EnumInfoEditDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);

  const {
    form: { control, reset },
    onSubmit,
    defaultValues,
    isSavingDefinition,
  } = useEnumForm({
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
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Enum Info</DialogTitle>
          </DialogHeader>
          <EnumInfoForm control={control} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSavingDefinition}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
