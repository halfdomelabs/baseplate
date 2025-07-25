import type { TransformerConfig } from '@baseplate-dev/project-builder-lib';
import type { ModelTransformerWebConfig } from '@baseplate-dev/project-builder-lib/web';
import type React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useControlledState,
} from '@baseplate-dev/ui-components';

import { ServiceTransformerForm } from './service-transformer-form.js';

interface ServiceTransformerDialogProps {
  children?: React.ReactNode;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  webConfig: ModelTransformerWebConfig | undefined;
  transformer: TransformerConfig | undefined;
  onUpdate: (transformer: TransformerConfig) => void;
  isCreate: boolean;
}

export function ServiceTransformerDialog({
  children,
  transformer,
  asChild,
  webConfig,
  open,
  onOpenChange,
  onUpdate,
  isCreate,
}: ServiceTransformerDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild={asChild}>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Create' : 'Edit'} {webConfig?.label} Transformer
          </DialogTitle>
          <DialogDescription>
            {webConfig?.instructions ??
              'Manage the transformer for the service'}
          </DialogDescription>
        </DialogHeader>
        {webConfig && (
          <ServiceTransformerForm
            transformer={transformer}
            onUpdate={(transformer) => {
              setIsOpen(false);
              onUpdate(transformer);
            }}
            webConfig={webConfig}
            isCreate={isCreate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
