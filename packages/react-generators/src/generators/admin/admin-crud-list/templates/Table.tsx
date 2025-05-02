// @ts-nocheck

import { Link } from 'react-router-dom';
import {
  Alert,
  LinkButton,
  Table,
  useToast,
  useConfirmDialog,
} from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';

interface Props {
  items: TPL_ROW_FRAGMENT[];
  deleteItem: (item: TPL_ROW_FRAGMENT) => Promise<void>;
  TPL_EXTRA_PROPS;
}

function TPL_COMPONENT_NAME(TPL_DESTRUCTURED_PROPS: Props): JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const toast = useToast();
  async function handleDelete(item: TPL_ROW_FRAGMENT): Promise<void> {
    requestConfirm({
      title: 'Delete Item',
      content: `Are you sure you want to delete this item?`,
      onConfirm: () => {
        deleteItem(item)
          .then(() => {
            toast.success('Successfully deleted the item!');
          })
          .catch((err) => {
            toast.error(
              logAndFormatError(err, 'Sorry we could not delete the item.'),
            );
          });
      },
    });
  }

  if (!items.length) {
    return <Alert type="info">No TPL_PLURAL_MODEL found.</Alert>;
  }

  return (
    <Table>
      <Table.Head>
        <Table.HeadRow>
          <TPL_HEADERS />
          <Table.HeadCell>Actions</Table.HeadCell>
        </Table.HeadRow>
      </Table.Head>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.id}>
            <TPL_CELLS />
            <Table.Cell className="space-x-4">
              <Link to={`${item.id}/edit`}>Edit</Link>
              <LinkButton negative onClick={() => handleDelete(item)}>
                Delete
              </LinkButton>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

export default TPL_COMPONENT_NAME;
