import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client';
import { Link } from '@tanstack/react-router';
import { MdDelete, MdEdit, MdMoreVert } from 'react-icons/md';
import { toast } from 'sonner';

import type { TodoListRowFragment } from '@src/generated/graphql';

import { Alert, AlertTitle } from '@src/components/ui/alert';
import { Button } from '@src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@src/components/ui/dropdown';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@src/components/ui/table';
import {
  DeleteTodoListDocument,
  GetTodoListsDocument,
} from '@src/generated/graphql';
import { useConfirmDialog } from '@src/hooks/use-confirm-dialog';
import { logAndFormatError } from '@src/services/error-formatter';

/* TPL_COMPONENT_NAME=TodoListTable */
/* TPL_ROW_FRAGMENT=TodoListRowFragment */

interface Props {
  items: TodoListRowFragment[];
  /* TPL_EXTRA_PROPS:BLOCK */
}

export function TodoListTable(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    items,
  } /* TPL_DESTRUCTURED_PROPS:END */ : Props,
): ReactElement {
  /* TPL_ACTION_HOOKS:START */
  const { requestConfirm } = useConfirmDialog();
  const [deleteTodoList] = useMutation(DeleteTodoListDocument, {
    refetchQueries: [{ query: GetTodoListsDocument }],
  });

  function handleDelete(item: TodoListRowFragment): void {
    requestConfirm({
      title: 'Delete Todo List',
      content: `Are you sure you want to delete todo list ${item.name ? item.name : 'unnamed todo list'}?`,
      onConfirm: () => {
        deleteTodoList({
          variables: { input: { id: item.id } },
        })
          .then(() => {
            toast.success('Successfully deleted todo list!');
          })
          .catch((err: unknown) => {
            toast.error(
              logAndFormatError(err, 'Sorry we could not delete todo list.'),
            );
          });
      },
    });
  }
  /* TPL_ACTION_HOOKS:END */

  if (items.length === 0) {
    return (
      <Alert variant="default">
        <AlertTitle>
          No {/* TPL_PLURAL_MODEL:START */}
          Todo Lists
          {/* TPL_PLURAL_MODEL:END */} found.
        </AlertTitle>
      </Alert>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {/* TPL_HEADERS:START */}
            <TableHead>Owner ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-12">Actions</TableHead>
            {/* TPL_HEADERS:END */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {/* TPL_CELLS:START */}
              <TableCell>{item.ownerId}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.createdAt}</TableCell>
              <TableCell className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    to="/admin/todos/todo-list/$id"
                    params={{ id: item.id }}
                  >
                    <MdEdit />
                    <span className="sr-only">Edit</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MdMoreVert />
                      <span className="sr-only">More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        handleDelete(item);
                      }}
                    >
                      <MdDelete className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              {/* TPL_CELLS:END */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* TPL_ACTION_SIBLING_COMPONENTS:START */}

      {/* TPL_ACTION_SIBLING_COMPONENTS:END */}
    </>
  );
}
