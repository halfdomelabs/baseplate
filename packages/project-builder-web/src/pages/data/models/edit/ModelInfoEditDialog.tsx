import {
  Button,
  Dialog,
  useControlledState,
} from '@halfdomelabs/ui-components';

import { ModelInfoForm } from './model/ModelInfoForm';
import { useModelForm } from '../hooks/useModelForm';

interface ModelInfoEditDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  asChild?: boolean;
}

export function ModelInfoEditDialog({
  open,
  onOpenChange,
  children,
  asChild,
}: ModelInfoEditDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);

  const {
    form: { control, reset },
    onSubmit,
    defaultValues,
  } = useModelForm({
    onSubmitSuccess() {
      setIsOpen(false);
    },
  });
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(newOpen) => {
        setIsOpen(newOpen);
        if (!newOpen) {
          reset(defaultValues);
        }
      }}
    >
      {children && (
        <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
      )}
      <Dialog.Content aria-describedby={undefined}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Dialog.Header>
            <Dialog.Title>Edit Model Info</Dialog.Title>
          </Dialog.Header>
          <ModelInfoForm control={control} />
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Save</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
