import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Dialog, useControlledState } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

import { ModelPrimaryKeyForm } from './ModelPrimaryKeyForm';

interface ModelPrimaryKeyDialogProps {
  control: Control<ModelConfig>;
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
}: ModelPrimaryKeyDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
      )}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Primary Keys</Dialog.Title>
          <Dialog.Description>
            Select the fields that will be used as the primary key for this
            model
          </Dialog.Description>
        </Dialog.Header>
        <ModelPrimaryKeyForm
          control={control}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
        />
      </Dialog.Content>
    </Dialog>
  );
}
