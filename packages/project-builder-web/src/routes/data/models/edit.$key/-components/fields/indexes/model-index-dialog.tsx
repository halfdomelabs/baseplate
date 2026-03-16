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

import { ModelIndexForm } from './model-index-form.js';

interface ModelIndexDialogProps {
  control: Control<ModelConfigInput>;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  indexId?: string;
}

export function ModelIndexDialog({
  control,
  trigger,
  open,
  onOpenChange,
  indexId,
}: ModelIndexDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Index</DialogTitle>
          <DialogDescription>
            Select the fields that will be part of this index.
          </DialogDescription>
        </DialogHeader>
        <ModelIndexForm
          control={control}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
          indexId={indexId}
        />
      </DialogContent>
    </Dialog>
  );
}
