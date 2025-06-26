// @ts-nocheck

import type { ReactElement } from 'react';

import {
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  useConfirmDialog,
} from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Props {
  items: TPL_ROW_FRAGMENT[];
  deleteItem: (item: TPL_ROW_FRAGMENT) => Promise<void>;
  TPL_EXTRA_PROPS;
}

function TPL_COMPONENT_NAME(TPL_DESTRUCTURED_PROPS: Props): ReactElement {
  const { requestConfirm } = useConfirmDialog();
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
    return (
      <Alert variant="default">
        No <TPL_PLURAL_MODEL /> found.
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TPL_HEADERS />
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TPL_CELLS />
            <TableCell className="space-x-4">
              <Link to={`${item.id}/edit`}>
                <Button variant="link" size="none">
                  Edit
                </Button>
              </Link>
              <Button
                variant="linkDestructive"
                onClick={() => {
                  handleDelete(item);
                }}
                size="none"
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default TPL_COMPONENT_NAME;
