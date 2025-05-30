import type React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InputFieldController,
} from '@halfdomelabs/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import type { AuthRoleInput } from '#src/roles/schema.js';

import { authRoleSchema } from '#src/roles/schema.js';

interface RoleDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  role?: AuthRoleInput;
  onSave: (role: AuthRoleInput) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
  onSave,
  asChild,
  children,
}: RoleDialogProps): React.JSX.Element {
  const isEditing = role?.id !== '';

  const form = useForm({
    resolver: zodResolver(authRoleSchema),
    values: role,
  });

  const { control, handleSubmit } = form;

  const onSubmit = handleSubmit((data) => {
    onSave(data);
    onOpenChange?.(false);
  });

  const formId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Role' : 'Add Role'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the role details below.'
                : 'Enter the details for the new role.'}
            </DialogDescription>
          </DialogHeader>
          <div className="auth:space-y-4 auth:py-4">
            <InputFieldController
              label="Role Name"
              name="name"
              control={control}
              placeholder="Enter role name"
            />
            <InputFieldController
              label="Description"
              name="comment"
              control={control}
              placeholder="Describe this role's purpose"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange?.(false);
              }}
            >
              Cancel
            </Button>
            <Button form={formId} type="submit">
              {isEditing ? 'Update' : 'Add'} Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
