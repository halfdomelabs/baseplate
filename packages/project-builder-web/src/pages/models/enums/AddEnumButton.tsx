import { Button, Dialog } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

import AddEnumForm from './AddEnumForm';

function AddEnumButton(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);

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
        <AddEnumForm onSubmit={() => setDialogOpen(false)} />
      </Dialog.Content>
    </Dialog>
  );
}

export default AddEnumButton;
