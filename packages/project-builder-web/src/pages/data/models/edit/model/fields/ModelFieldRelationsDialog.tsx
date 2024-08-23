import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { Dialog, useControlledState } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { Control } from 'react-hook-form';

import { ModelFieldRelationForm } from './ModelFieldRelationForm';

interface ModalRelationsModalProps {
  control: Control<ModelConfig>;
  fieldIdx: number;
  children?: React.ReactNode;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function ModelFieldRelationsDialog({
  fieldIdx,
  control,
  children,
  asChild,
  open,
  onOpenChange,
}: ModalRelationsModalProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
      )}
      <Dialog.Content aria-describedby={undefined}>
        <ModelFieldRelationForm
          control={control}
          fieldIdx={fieldIdx}
          onSubmitSuccess={() => {
            setIsOpen(false);
          }}
        />
      </Dialog.Content>
    </Dialog>
  );
}
