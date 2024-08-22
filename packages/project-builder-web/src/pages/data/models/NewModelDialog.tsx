import { useBlockBeforeContinue } from '@halfdomelabs/project-builder-lib/web';
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
    onSubmit,
    form: { control },
  } = useModelForm({ isCreate: true, onSubmitSuccess: () => setIsOpen(false) });

  const blockBeforeContinue = useBlockBeforeContinue();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(shouldOpen) => {
        if (!shouldOpen) setIsOpen(false);
        else {
          blockBeforeContinue({
            onContinue: () => {
              setIsOpen(true);
            },
          });
        }
      }}
    >
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>New Model</Dialog.Title>
          <Dialog.Description>
            Models define the structure of your data.
          </Dialog.Description>
        </Dialog.Header>
        <form onSubmit={onSubmit} className="space-y-4">
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
