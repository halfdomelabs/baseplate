import {
  Button,
  Dialog,
  useControlledState,
} from '@halfdomelabs/ui-components';

import { EnumInfoForm } from '../../components/EnumInfoForm';
import { useEnumForm } from '../../hooks/useEnumForm';

interface EnumInfoEditDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  asChild?: boolean;
}

export function EnumInfoEditDialog({
  open,
  onOpenChange,
  asChild,
  children,
}: EnumInfoEditDialogProps): JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);

  const {
    form: { control, reset },
    onSubmit,
    defaultValues,
  } = useEnumForm({
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
      <Dialog.Trigger asChild={asChild}>{children}</Dialog.Trigger>
      <Dialog.Content aria-describedby={undefined}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Dialog.Header>
            <Dialog.Title>Edit Enum Info</Dialog.Title>
          </Dialog.Header>
          <EnumInfoForm control={control} />
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
