import { useBlockBeforeContinue } from '@halfdomelabs/project-builder-lib/web';
import { Button, Dialog } from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';

import AddEnumForm from './AddEnumForm';

function AddEnumButton(): JSX.Element {
  const [dialogOpen, setDialogOpen] = useState(false);

  const blockBeforeContinue = useBlockBeforeContinue();

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Button
        variant="secondary"
        className="text-primary"
        onClick={() => {
          blockBeforeContinue({
            onContinue: () => {
              setDialogOpen(true);
            },
          });
        }}
      >
        <HiOutlinePlus /> Add Enum
      </Button>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Add Enum</Dialog.Title>
          <Dialog.Description>
            Create a new enum to use in your project
          </Dialog.Description>
        </Dialog.Header>
        <AddEnumForm onSubmit={() => setDialogOpen(false)} />
      </Dialog.Content>
    </Dialog>
  );
}

export default AddEnumButton;
