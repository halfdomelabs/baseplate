import type React from 'react';

import { useDefinitionSchema } from '@baseplate-dev/project-builder-lib/web';
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
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import type { AuthRoleInput } from '../../schema/roles/schema.js';

import { createAuthRoleSchema } from '../../schema/roles/schema.js';

interface RoleDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  role?: AuthRoleInput;
  isNew?: boolean;
  onSave: (role: AuthRoleInput) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}

export function RoleDialog({
  open,
  onOpenChange,
  role,
  isNew = false,
  onSave,
  asChild,
  children,
}: RoleDialogProps): React.JSX.Element {
  const authRoleSchema = useDefinitionSchema(createAuthRoleSchema);
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
            <DialogTitle>{isNew ? 'Add Role' : 'Edit Role'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Enter the details for the new role.'
                : 'Update the role details below.'}
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
              {isNew ? 'Add' : 'Update'} Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
