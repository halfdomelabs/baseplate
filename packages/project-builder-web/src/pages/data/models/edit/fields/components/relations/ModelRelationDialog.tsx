import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Dialog, useControlledState } from '@halfdomelabs/ui-components';
import { Control } from 'react-hook-form';

import { ModelRelationForm } from './ModelRelationForm';

interface ModelRelationDialogProps {
  control: Control<ModelConfig>;
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
}: ModelRelationDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
      )}
      <Dialog.Content width="lg">
        <Dialog.Header>
          <Dialog.Title>
            {relationId ? 'Edit Relation' : 'Create Relation'}
          </Dialog.Title>
          <Dialog.Description>
            Set up the relation between this model and another model
          </Dialog.Description>
        </Dialog.Header>
        <ModelRelationForm
          control={control}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
          relationId={relationId}
          defaultFieldName={defaultFieldName}
        />
      </Dialog.Content>
    </Dialog>
  );
}
