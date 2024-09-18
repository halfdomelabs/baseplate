import { EnumConfig } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  Dialog,
  Dropdown,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { MdMoreVert, MdDeleteOutline, MdMode } from 'react-icons/md';

import { EnumInfoForm } from './EnumInfoForm';
import { useEnumForm } from '../hooks/useEnumForm';

export function EnumOptionsDropdown({
  enumDefinition,
  handleDelete,
}: {
  enumDefinition: EnumConfig;
  handleDelete: (id: string) => void;
}): JSX.Element {
  const { requestConfirm } = useConfirmDialog();

  const [isOpen, setIsOpen] = useState(false);
  const {
    onSubmit,
    form: { control },
  } = useEnumForm({ onSubmitSuccess: () => setIsOpen(false) });

  // TODO: refactor this to another component
  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <Dropdown>
        <Dropdown.Trigger>
          <Button variant="outline" size="icon">
            <Button.Icon icon={MdMoreVert} />
          </Button>
        </Dropdown.Trigger>
        <Dropdown.Content align="end">
          <Dialog.Trigger asChild>
            <Dropdown.Item>
              <Button.Icon icon={MdMode} />
              <span className="ml-2">Edit</span>
            </Dropdown.Item>
          </Dialog.Trigger>
          <Dropdown.Item
            className="text-destructive"
            onClick={() => {
              requestConfirm({
                title: 'Confirm delete',
                content: `Are you sure you want to delete ${
                  enumDefinition?.name ?? 'the enum'
                }?`,
                buttonConfirmText: 'Delete',
                onConfirm: () => handleDelete(enumDefinition.id),
              });
            }}
          >
            <Button.Icon icon={MdDeleteOutline} />
            <span className="ml-2">Delete</span>
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Edit Enum Info</Dialog.Title>
          <Dialog.Description>
            Enums are a list of values that can be used in your data models.
          </Dialog.Description>
        </Dialog.Header>
        <form onSubmit={onSubmit} className="space-y-4">
          <EnumInfoForm control={control} />
          <Dialog.Footer>
            <Dialog.Close asChild>
              <Button variant="outline">Cancel</Button>
            </Dialog.Close>
            <Button type="submit">Save</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog>
  );
}
