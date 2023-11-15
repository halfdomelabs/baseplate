import { Button, Dialog } from '@halfdomelabs/ui-components';

import { useModelForm } from './hooks/useModelForm';
import { ModelGeneralForm } from './model/ModelGeneralForm';

interface ModelGeneralEditDialogProps {
  onClose: () => void;
  isOpen: boolean;
}

export function ModelGeneralEditDialog({
  onClose,
  isOpen,
}: ModelGeneralEditDialogProps): JSX.Element {
  const {
    form: { control, handleSubmit },
    onFormSubmit,
  } = useModelForm({
    onSubmitSuccess() {
      onClose();
    },
  });
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Edit Model</Dialog.Title>
          </Dialog.Header>
          <ModelGeneralForm control={control} />
          <Dialog.Footer>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </Dialog.Footer>
        </Dialog.Content>
      </form>
    </Dialog>
  );
}
