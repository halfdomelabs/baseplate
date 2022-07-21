// @ts-nocheck

import { Link } from 'react-router-dom';
import { Alert, LinkButton, Table } from '%react-components';
import { useToast } from '%react-components/useToast';
import { formatError } from '%react-error/formatter';

interface Props {
  items: ROW_FRAGMENT[];
  deleteItem: (item: ROW_FRAGMENT) => Promise<void>;
  EXTRA_PROPS;
}

function COMPONENT_NAME({
  items,
  deleteItem,
  EXTRA_PROP_SPREAD,
}: Props): JSX.Element {
  const toast = useToast();
  async function handleDelete(item: ROW_FRAGMENT): Promise<void> {
    if (!window.confirm(`Are you sure you want to delete this item?`)) {
      return;
    }
    try {
      await deleteItem(item);
      toast.success('Successfully deleted the item!');
    } catch (err) {
      toast.error(formatError(err, 'Sorry we could not delete the item.'));
    }
  }

  if (!items.length) {
    return <Alert type="info">No PLURAL_MODEL found.</Alert>;
  }

  return (
    <Table>
      <Table.Head>
        <Table.HeadRow>
          <HEADERS />
          <Table.HeadCell>Actions</Table.HeadCell>
        </Table.HeadRow>
      </Table.Head>
      <Table.Body>
        {items.map((item) => (
          <Table.Row key={item.id}>
            <CELLS />
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

export default COMPONENT_NAME;
