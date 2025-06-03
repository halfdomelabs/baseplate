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

import { ModelRelationForm } from './ModelRelationForm.js';

interface ModelRelationDialogProps {
  control: Control<ModelConfigInput>;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children?: React.ReactNode;
  relationId?: string;
  defaultFieldName?: string;
}

export function ModelRelationDialog({
  control,
  children,
  asChild,
  open,
  onOpenChange,
  relationId,
  defaultFieldName,
}: ModelRelationDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild={asChild}>{children}</DialogTrigger>}
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>
            {relationId ? 'Edit Relation' : 'Create Relation'}
          </DialogTitle>
          <DialogDescription>
            Set up the relation between this model and another model
          </DialogDescription>
        </DialogHeader>
        <ModelRelationForm
          control={control}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
          relationId={relationId}
          defaultFieldName={defaultFieldName}
        />
      </DialogContent>
    </Dialog>
  );
}
