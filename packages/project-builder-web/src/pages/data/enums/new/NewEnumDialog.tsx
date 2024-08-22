import { useBlockBeforeContinue } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dialog,
  useControlledState,
} from '@halfdomelabs/ui-components';

import { EnumInfoForm } from '../edit/EnumInfoForm';
import { useEnumForm } from '../hooks/useEnumForm';

interface NewEnumDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewEnumDialog({
  children,
  open,
  onOpenChange,
}: NewEnumDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const {
    onSubmit,
    form: { control },
  } = useEnumForm({ isCreate: true, onSubmitSuccess: () => setIsOpen(false) });

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
          <Dialog.Title>New Enum</Dialog.Title>
          <Dialog.Description>
            Enums are a list of values that can be used in your data models.
          </Dialog.Description>
        </Dialog.Header>
        <form onSubmit={onSubmit} className="space-y-4">
          <EnumInfoForm control={control} />
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Create Enum</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
