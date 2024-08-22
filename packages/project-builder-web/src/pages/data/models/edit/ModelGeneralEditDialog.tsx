import { Button, Dialog } from '@halfdomelabs/ui-components';

import { ModelGeneralForm } from './model/ModelGeneralForm';
import { useModelForm } from '../hooks/useModelForm';

interface ModelGeneralEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModelGeneralEditDialog({
  open,
  onOpenChange,
}: ModelGeneralEditDialogProps): JSX.Element {
  const {
    form: { control, reset },
    onSubmit,
    defaultValues,
  } = useModelForm({
    onSubmitSuccess() {
      onOpenChange(false);
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          reset(defaultValues);
        }
      }}
    >
      <Dialog.Content aria-describedby={undefined}>
        <form onSubmit={onSubmit} className="space-y-4">
          <Dialog.Header>
            <Dialog.Title>Edit Model Info</Dialog.Title>
          </Dialog.Header>
          <ModelGeneralForm control={control} />
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
