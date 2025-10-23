import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  MdDelete,
  MdEdit,
  MdKey,
  MdMoreVert,
  MdSecurity,
} from 'react-icons/md';
import { toast } from 'sonner';

import type { UserRowFragment } from '@src/generated/graphql';

import { Alert, AlertTitle } from '@src/components/ui/alert';
import { Badge } from '@src/components/ui/badge';
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
import { DeleteUserDocument, GetUsersDocument } from '@src/generated/graphql';
import { useConfirmDialog } from '@src/hooks/use-confirm-dialog';
import { logAndFormatError } from '@src/services/error-formatter';

import { PasswordResetDialog } from './password-reset-dialog';
import { RoleManagerDialog } from './role-manager-dialog';

/* TPL_COMPONENT_NAME=UserTable */
/* TPL_ROW_FRAGMENT=UserRowFragment */

interface Props {
  items: UserRowFragment[];
  /* TPL_EXTRA_PROPS:BLOCK */
}

export function UserTable(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    items,
  } /* TPL_DESTRUCTURED_PROPS:END */ : Props,
): ReactElement {
  /* TPL_ACTION_HOOKS:START */
  const [roleDialogUser, setRoleDialogUser] = useState<UserRowFragment | null>(
    null,
  );
  const [passwordResetUser, setPasswordResetUser] =
    useState<UserRowFragment | null>(null);
  const { requestConfirm } = useConfirmDialog();
  const [deleteUser] = useMutation(DeleteUserDocument, {
    refetchQueries: [{ query: GetUsersDocument }],
  });

  function handleDelete(item: UserRowFragment): void {
    requestConfirm({
      title: 'Delete User',
      content: `Are you sure you want to delete user ${item.name ? item.name : 'unnamed user'}?`,
      onConfirm: () => {
        deleteUser({
          variables: { input: { id: item.id } },
        })
          .then(() => {
            toast.success('Successfully deleted user!');
          })
          .catch((err: unknown) => {
            toast.error(
              logAndFormatError(err, 'Sorry we could not delete user.'),
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
          Users
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
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead className="w-12">Actions</TableHead>
            {/* TPL_HEADERS:END */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {/* TPL_CELLS:START */}
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {item.roles.map((userRole) => (
                    <Badge key={userRole.role} variant="secondary">
                      {userRole.role}
                    </Badge>
                  ))}
                  {item.roles.length === 0 && (
                    <span className="text-muted-foreground text-sm">
                      No roles
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/admin/accounts/users/$id" params={{ id: item.id }}>
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
                        setRoleDialogUser(item);
                      }}
                    >
                      <MdSecurity className="mr-2 h-4 w-4" />
                      Manage Roles
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPasswordResetUser(item);
                      }}
                    >
                      <MdKey className="mr-2 h-4 w-4" />
                      Reset Password
                    </DropdownMenuItem>
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
      {roleDialogUser && (
        <RoleManagerDialog
          user={roleDialogUser}
          open={!!roleDialogUser}
          onOpenChange={(open) => {
            if (!open) setRoleDialogUser(null);
          }}
        />
      )}
      {passwordResetUser && (
        <PasswordResetDialog
          user={passwordResetUser}
          open={!!passwordResetUser}
          onOpenChange={(open) => {
            if (!open) setPasswordResetUser(null);
          }}
        />
      )}
      {/* TPL_ACTION_SIBLING_COMPONENTS:END */}
    </>
  );
}
