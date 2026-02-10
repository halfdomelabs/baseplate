import type { AuthorizerRoleConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useControlledState,
} from '@baseplate-dev/ui-components';

import { ModelAuthorizerRoleForm } from './model-authorizer-role-form.js';

interface ModelAuthorizerRoleDialogProps {
  children?: React.ReactNode;
  asChild?: boolean;
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  role?: AuthorizerRoleConfig;
  onSave: (role: AuthorizerRoleConfig) => void;
}

export function ModelAuthorizerRoleDialog({
  children,
  role,
  asChild,
  open,
  onOpenChange,
  onSave,
}: ModelAuthorizerRoleDialogProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useControlledState(open, onOpenChange, false);
  const isCreate = !role;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild={asChild}>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCreate ? 'Create' : 'Edit'} Authorization Role
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Define a new authorization role with a TypeScript expression'
              : 'Edit the authorization role definition'}
          </DialogDescription>
        </DialogHeader>
        <ModelAuthorizerRoleForm
          defaultValues={role}
          onSubmit={(updatedRole) => {
            setIsOpen(false);
            onSave(updatedRole);
          }}
          onCancel={() => {
            setIsOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
