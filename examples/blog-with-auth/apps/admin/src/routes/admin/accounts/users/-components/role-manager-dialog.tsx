import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import type { UserRowFragment } from '@src/generated/graphql';

import { Button } from '@src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/components/ui/dialog';
import { MultiComboboxFieldController } from '@src/components/ui/multi-combobox-field';
import {
  GetUsersDocument,
  UpdateUserRolesDocument,
} from '@src/generated/graphql';

const roleFormSchema = z.object({
  roles: z.array(z.string()),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

interface RoleOption {
  value: string;
  label: string;
  description: string;
}

// Define available roles (excluding built-in roles)
const AVAILABLE_ROLES: RoleOption[] = /* TPL_AVAILABLE_ROLES:START */ [
  { value: 'admin', label: 'admin', description: 'Administrator role' },
]; /* TPL_AVAILABLE_ROLES:END */

interface RoleManagerDialogProps {
  user: UserRowFragment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for managing user roles.
 * Allows admins to assign or remove roles from users.
 * Self-contained component that handles its own mutation logic.
 *
 * @param props - The component props
 * @param props.user - The user whose roles are being managed
 * @param props.open - Whether the dialog is open
 * @param props.onOpenChange - Callback when dialog open state changes
 * @returns The role manager dialog component
 */
export function RoleManagerDialog({
  user,
  open,
  onOpenChange,
}: RoleManagerDialogProps): ReactElement {
  const [isSaving, setIsSaving] = useState(false);

  const [updateUserRoles] = useMutation(UpdateUserRolesDocument, {
    refetchQueries: [{ query: GetUsersDocument }],
  });

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      roles: user.roles.map((r: { role: string }) => r.role),
    },
  });

  const handleSubmit = async (data: RoleFormData): Promise<void> => {
    setIsSaving(true);
    try {
      await updateUserRoles({
        variables: {
          input: { userId: user.id, roles: data.roles },
        },
      });
      toast.success('Roles updated successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update roles');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>
            Assign roles to {user.name ?? user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="py-4">
            <MultiComboboxFieldController
              control={form.control}
              name="roles"
              label="User Roles"
              description="Select one or more roles for this user. Built-in roles like 'user' and 'public' are automatically assigned."
              placeholder="Search and select roles..."
              options={AVAILABLE_ROLES}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.value}
              renderItemLabel={(option) => (
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              )}
              noResultsText="No roles found"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              Save Roles
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
