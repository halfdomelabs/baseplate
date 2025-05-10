// @ts-nocheck

import type { ReactElement } from 'react';

import {
  Alert,
  LinkButton,
  Table,
  useConfirmDialog,
  useToast,
} from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { Link } from 'react-router-dom';

interface Props {
  items: TPL_ROW_FRAGMENT[];
  deleteItem: (item: TPL_ROW_FRAGMENT) => Promise<void>;
  TPL_EXTRA_PROPS;
}

function TPL_COMPONENT_NAME(TPL_DESTRUCTURED_PROPS: Props): ReactElement {
  const { requestConfirm } = useConfirmDialog();
  const toast = useToast();
  function handleDelete(item: TPL_ROW_FRAGMENT): void {
    requestConfirm({
      title: 'Delete Item',
      content: `Are you sure you want to delete this item?`,
      onConfirm: () => {
        deleteItem(item)
          .then(() => {
            toast.success('Successfully deleted the item!');
          })
          .catch((err: unknown) => {
            toast.error(
              logAndFormatError(err, 'Sorry we could not delete the item.'),
            );
          });
      },
    });
  }

  if (items.length === 0) {
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
              <Link to={`${item.id}/show`}>Show</Link>
              <Link to={`${item.id}/edit`}>Edit</Link>
              <LinkButton
                negative
                onClick={() => {
                  handleDelete(item);
                }}
              >
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
