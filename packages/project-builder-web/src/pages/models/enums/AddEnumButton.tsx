import { Button, Dialog } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

import AddEnumForm from './AddEnumForm';
import { useEnumForm } from './hooks/useEnumForm';

function AddEnumButton(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { form, handleSubmit } = useEnumForm({
    onSubmitSuccess: () => setDialogOpen(false),
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Button
        variant="secondary"
        className="text-primary"
        onClick={() => setDialogOpen(true)}
      >
        <HiOutlinePlus /> Add Enum
      </Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Add Enum</Dialog.Title>
        </Dialog.Header>
        <AddEnumForm form={form} onSubmit={handleSubmit} />
      </Dialog.Content>
    </Dialog>
  );
}

export default AddEnumButton;
