import { EnumConfig } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  Dropdown,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { MdMoreVert, MdDeleteOutline } from 'react-icons/md';

export function EnumOptionsDropdown({
  enumDefinition,
  handleDelete,
}: {
  enumDefinition: EnumConfig;
  handleDelete: (id: string) => void;
}): JSX.Element {
  const { requestConfirm } = useConfirmDialog();

  return (
    <Dropdown>
      <Dropdown.Trigger>
        <Button variant="outline" size="icon">
          <Button.Icon icon={MdMoreVert} />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Content align="end">
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
  );
}
