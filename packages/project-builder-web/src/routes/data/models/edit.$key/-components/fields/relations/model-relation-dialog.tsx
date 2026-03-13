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

import { ModelRelationForm } from './model-relation-form.js';

interface ModelRelationDialogProps {
  control: Control<ModelConfigInput>;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  relationId?: string;
  defaultFieldName?: string;
}

export function ModelRelationDialog({
  control,
  trigger,
  open,
  onOpenChange,
  relationId,
  defaultFieldName,
}: ModelRelationDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger render={trigger} />}
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
