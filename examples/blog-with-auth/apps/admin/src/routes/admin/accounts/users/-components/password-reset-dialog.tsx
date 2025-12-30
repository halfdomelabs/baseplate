import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/components/ui/dialog';
import { InputFieldController } from '@src/components/ui/input-field';
import { type FragmentOf, graphql, readFragment } from '@src/graphql';

const PASSWORD_MIN_LENGTH = 8;

const passwordResetSchema = z
  .object({
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      )
      .max(255, 'Password is too long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

export const passwordResetDialogUserFragment = graphql(`
  fragment PasswordResetDialog_user on User {
    id
    name
    email
  }
`);

const resetUserPasswordMutation = graphql(
  `
    mutation ResetUserPassword($input: ResetUserPasswordInput!) {
      resetUserPassword(input: $input) {
        user {
          ...PasswordResetDialog_user
        }
      }
    }
  `,
  [passwordResetDialogUserFragment],
);

interface PasswordResetDialogProps {
  user: FragmentOf<typeof passwordResetDialogUserFragment>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for resetting a user's password.
 * Allows admins to set a new password for any user without requiring the current password.
 * Self-contained component that handles its own mutation logic.
 *
 * @param props - The component props
 * @param props.user - The user whose password is being reset
 * @param props.open - Whether the dialog is open
 * @param props.onOpenChange - Callback when dialog open state changes
 * @returns The password reset dialog component
 */
export function PasswordResetDialog({
  user,
  open,
  onOpenChange,
}: PasswordResetDialogProps): ReactElement {
  const [isSaving, setIsSaving] = useState(false);

  // Unmask the fragment data
  const userData = readFragment(passwordResetDialogUserFragment, user);

  const [resetUserPassword] = useMutation(resetUserPasswordMutation);

  const form = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: PasswordResetFormData): Promise<void> => {
    setIsSaving(true);
    try {
      await resetUserPassword({
        variables: {
          input: {
            userId: userData.id,
            newPassword: data.newPassword,
          },
        },
      });
      toast.success('Password reset successfully');
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Set a new password for {userData.name ?? userData.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 py-4">
            <InputFieldController
              control={form.control}
              name="newPassword"
              label="New Password"
              type="password"
              placeholder="Enter new password"
              description={`Must be at least ${PASSWORD_MIN_LENGTH} characters`}
              autoComplete="off"
            />

            <InputFieldController
              control={form.control}
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                form.reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              Reset Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
