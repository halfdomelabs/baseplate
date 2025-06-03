import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useControlledState,
} from '@baseplate-dev/ui-components';

import { ModelPrimaryKeyForm } from './ModelPrimaryKeyForm.js';

interface ModelPrimaryKeyDialogProps {
  control: Control<ModelConfigInput>;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children?: React.ReactNode;
}

export function ModelPrimaryKeyDialog({
  control,
  children,
  asChild,
  open,
  onOpenChange,
}: ModelPrimaryKeyDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild={asChild}>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Primary Keys</DialogTitle>
          <DialogDescription>
            Select the fields that will be used as the primary key for this
            model
          </DialogDescription>
        </DialogHeader>
        <ModelPrimaryKeyForm
          control={control}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
