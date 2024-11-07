import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Dialog, useControlledState } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

import { ModelUniqueConstraintForm } from './ModelUniqueConstraintForm';

interface ModelUniqueConstraintDialogProps {
  control: Control<ModelConfig>;
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
}: ModelUniqueConstraintDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
      )}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Unique Constraint</Dialog.Title>
          <Dialog.Description>
            Select the fields that will be part of this unique constraint.
          </Dialog.Description>
        </Dialog.Header>
        <ModelUniqueConstraintForm
          control={control}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
          constraintId={constraintId}
        />
      </Dialog.Content>
    </Dialog>
  );
}
