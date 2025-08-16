// @ts-nocheck

import type { ReactElement } from 'react';

import {
  Alert,
  AlertTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  useConfirmDialog,
} from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { useMutation } from '@apollo/client';
import { Link } from '@tanstack/react-router';
import { MdDelete, MdEdit } from 'react-icons/md';
import { toast } from 'sonner';

interface Props {
  items: TPL_ROW_FRAGMENT[];
  TPL_EXTRA_PROPS;
}

export function TPL_COMPONENT_NAME(
  TPL_DESTRUCTURED_PROPS: Props,
): ReactElement {
  const { requestConfirm } = useConfirmDialog();
  const [TPL_DELETE_METHOD] = useMutation(TPL_DELETE_MUTATION, {
    refetchQueries: [{ query: TPL_REFETCH_DOCUMENT }],
  });

  const handleDeleteItem = async (item: TPL_ROW_FRAGMENT): Promise<void> => {
    await TPL_DELETE_METHOD({
      variables: { input: { id: item.id } },
    });
  };

  function handleDelete(item: TPL_ROW_FRAGMENT): void {
    requestConfirm({
      title: 'Delete Item',
      content: `Are you sure you want to delete this item?`,
      onConfirm: () => {
        handleDeleteItem(item)
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
        <AlertTitle>
          No <TPL_PLURAL_MODEL /> found.
        </AlertTitle>
      </Alert>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TPL_HEADERS />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TPL_CELLS />
            <TableCell className="flex items-center gap-2">
              <Link to={TPL_EDIT_ROUTE} params={{ id: item.id }}>
                <Button variant="ghost" size="icon">
                  <MdEdit />
                  <span className="sr-only">Edit</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  handleDelete(item);
                }}
              >
                <MdDelete />
                <span className="sr-only">Delete</span>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
