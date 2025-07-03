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

import { ModelUniqueConstraintForm } from './model-unique-constraint-form.js';

interface ModelUniqueConstraintDialogProps {
  control: Control<ModelConfigInput>;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children?: React.ReactNode;
  constraintId?: string;
}

export function ModelUniqueConstraintDialog({
  control,
  children,
  asChild,
  open,
  onOpenChange,
  constraintId,
}: ModelUniqueConstraintDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild={asChild}>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unique Constraint</DialogTitle>
          <DialogDescription>
            Select the fields that will be part of this unique constraint.
          </DialogDescription>
        </DialogHeader>
        <ModelUniqueConstraintForm
          control={control}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
          constraintId={constraintId}
        />
      </DialogContent>
    </Dialog>
  );
}
