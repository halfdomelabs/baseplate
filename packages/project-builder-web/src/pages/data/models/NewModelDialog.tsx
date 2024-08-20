import { FeatureComboboxField } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  Dialog,
  InputField,
  useControlledState,
} from '@halfdomelabs/ui-components';

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
          <InputField.Controller
            control={control}
            label="Name"
            name="name"
            description="The name of the model (PascalCase)"
          />
          <FeatureComboboxField.Controller
            control={control}
            name="feature"
            description="The feature this model belongs to"
          />
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
