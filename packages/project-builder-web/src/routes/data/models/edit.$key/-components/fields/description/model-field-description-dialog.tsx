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

import { ModelFieldDescriptionForm } from './model-field-description-form.js';

interface ModelFieldDescriptionDialogProps {
  control: Control<ModelConfigInput>;
  idx: number;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function ModelFieldDescriptionDialog({
  control,
  idx,
  trigger,
  open,
  onOpenChange,
}: ModelFieldDescriptionDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Field Description</DialogTitle>
          <DialogDescription>
            Optional description shown on the corresponding field in the
            generated GraphQL schema.
          </DialogDescription>
        </DialogHeader>
        <ModelFieldDescriptionForm
          control={control}
          idx={idx}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
