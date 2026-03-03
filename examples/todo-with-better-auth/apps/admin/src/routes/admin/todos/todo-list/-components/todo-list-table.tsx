import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { Link } from '@tanstack/react-router';
import { MdDelete, MdEdit, MdMoreVert } from 'react-icons/md';
import { toast } from 'sonner';

import type { FragmentOf, ResultOf } from '@src/graphql';

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
import { graphql, readFragment } from '@src/graphql';
import { useConfirmDialog } from '@src/hooks/use-confirm-dialog';
import { logAndFormatError } from '@src/services/error-formatter';

/* HOISTED:delete-action-mutation:START */
const todoListListPageDeleteTodoListMutation = graphql(`
  mutation TodoListListPageDeleteTodoList($input: DeleteTodoListInput!) {
    deleteTodoList(input: $input) {
      todoList {
        id
        name
      }
    }
  }
`);
/* HOISTED:delete-action-mutation:END */

/* TPL_COMPONENT_NAME=TodoListTable */
/* TPL_ITEMS_FRAGMENT_NAME=todoListTableItemsFragment */

/* TPL_ITEMS_FRAGMENT:START */
export const todoListTableItemsFragment = graphql(`
  fragment TodoListTable_items on TodoList {
    createdAt
    id
    name
    ownerId
  }
`);
/* TPL_ITEMS_FRAGMENT:END */

interface Props {
  /* TPL_PROPS:START */
  items: FragmentOf<typeof todoListTableItemsFragment>[];
  /* TPL_PROPS:END */
}

export function TodoListTable(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    items,
  } /* TPL_DESTRUCTURED_PROPS:END */ : Props,
): ReactElement {
  /* TPL_ACTION_HOOKS:START */
  const { requestConfirm } = useConfirmDialog();
  const [deleteTodoList] = useMutation(todoListListPageDeleteTodoListMutation, {
    update: (cache, result) => {
      if (!result.data?.deleteTodoList.todoList) return;
      const itemId = cache.identify(result.data.deleteTodoList.todoList);
      cache.evict({ id: itemId });
      cache.gc();
    },
  });

  function handleDelete(
    item: ResultOf<typeof todoListTableItemsFragment>,
  ): void {
    requestConfirm({
      title: 'Delete Todo List',
      content: `Are you sure you want to delete todo list ${item.name ? item.name : 'unnamed todo list'}?`,
      onConfirm: () => {
        deleteTodoList({
          variables: { input: { id: item.id } },
        })
          .then(() => {
            toast.success('Successfully deleted the todo list!');
          })
          .catch((err: unknown) => {
            toast.error(
              logAndFormatError(
                err,
                'Sorry, we could not delete the todo list.',
              ),
            );
          });
      },
    });
  }
  /* TPL_ACTION_HOOKS:END */

  // Unmask the fragment data for rendering
  const itemsData = readFragment(todoListTableItemsFragment, items);

  if (itemsData.length === 0) {
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
          {itemsData.map((item) => (
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
