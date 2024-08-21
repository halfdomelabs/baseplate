import {
  Button,
  Dialog,
  useControlledState,
} from '@halfdomelabs/ui-components';

import { ModelGeneralForm } from './edit/model/ModelGeneralForm';
import { useModelForm } from './hooks/useModelForm';

interface NewModelDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewModelDialog({
  children,
  open,
  onOpenChange,
}: NewModelDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const {
    onFormSubmit,
    form: { control },
  } = useModelForm({ isCreate: true, onSubmitSuccess: () => setIsOpen(false) });
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content aria-describedby={undefined}>
        <Dialog.Header>
          <Dialog.Title>New Model</Dialog.Title>
        </Dialog.Header>
        <form onSubmit={onFormSubmit} className="space-y-4">
          <ModelGeneralForm control={control} />
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Create Model</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
