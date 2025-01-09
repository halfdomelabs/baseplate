import type { TransformerConfig } from '@halfdomelabs/project-builder-lib';
import type { ModelTransformerWebConfig } from '@halfdomelabs/project-builder-lib/web';
import type React from 'react';

import { Dialog, useControlledState } from '@halfdomelabs/ui-components';

import { ServiceTransformerForm } from './ServiceTransformerForm';

interface ServiceTransformerDialogProps {
  children?: React.ReactNode;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  webConfig: ModelTransformerWebConfig | undefined;
  transformer: TransformerConfig | undefined;
  onUpdate: (transformer: TransformerConfig) => void;
}

export function ServiceTransformerDialog({
  children,
  transformer,
  asChild,
  webConfig,
  open,
  onOpenChange,
  onUpdate,
}: ServiceTransformerDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
      )}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>
            {transformer?.id ? 'Edit' : 'Create'} {webConfig?.label} Transformer
          </Dialog.Title>
          <Dialog.Description>
            {webConfig?.instructions ??
              'Manage the transformer for the service'}
          </Dialog.Description>
        </Dialog.Header>
        {webConfig && (
          <ServiceTransformerForm
            transformer={transformer}
            onUpdate={(transformer) => {
              setIsOpen(false);
              onUpdate(transformer);
            }}
            webConfig={webConfig}
          />
        )}
      </Dialog.Content>
    </Dialog>
  );
}
