import { Button, Dialog } from '@halfdomelabs/ui-components';

import { ModelGeneralForm } from './model/ModelGeneralForm';
import { useModelForm } from '../hooks/useModelForm';

interface ModelGeneralEditDialogProps {
  onClose: () => void;
  isOpen: boolean;
}

export function ModelGeneralEditDialog({
  onClose,
  isOpen,
}: ModelGeneralEditDialogProps): JSX.Element {
  const {
    form: { control },
    onFormSubmit,
  } = useModelForm({
    onSubmitSuccess() {
      onClose();
    },
  });
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Dialog.Content>
        <form onSubmit={onFormSubmit}>
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
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
