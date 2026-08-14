import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';

import type { FragmentType } from '@src/gql';

import { Button } from '@src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/components/ui/dialog';
import { graphql, readFragment } from '@src/gql';
import { logAndFormatError } from '@src/services/error-formatter';
import { getApolloErrorCode } from '@src/utils/apollo-error';

export const inviteUserDialogUserFragment = graphql(`
  fragment InviteUserDialog_user on User {
    id
    email
  }
`);

const inviteUserMutation = graphql(`
  mutation InviteUserDialogInviteUser($input: InviteUserInput!) {
    inviteUser(input: $input) {
      user {
        ...InviteUserDialog_user
      }
    }
  }
`);

interface InviteUserDialogProps {
  user: FragmentType<typeof inviteUserDialogUserFragment>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for sending an invite email so a user can set their password and sign in.
 * Self-contained component that handles its own mutation logic.
 *
 * @param props - The component props
 * @param props.user - The user to invite
 * @param props.open - Whether the dialog is open
 * @param props.onOpenChange - Callback when dialog open state changes
 * @returns The invite user dialog component
 */
export function InviteUserDialog({
  user,
  open,
  onOpenChange,
}: InviteUserDialogProps): ReactElement {
  // Unmask the fragment data
  const userData = readFragment(inviteUserDialogUserFragment, user);

  const [inviteUser, { loading }] = useMutation(inviteUserMutation);

  const handleConfirm = (): void => {
    inviteUser({
      variables: { input: { userId: userData.id } },
    })
      .then(() => {
        toast.success('Invite sent!');
        onOpenChange(false);
      })
      .catch((err: unknown) => {
        const errorCode = getApolloErrorCode(err, [
          'user-already-has-account',
          'user-has-no-email',
        ] as const);
        switch (errorCode) {
          case 'user-already-has-account': {
            toast.error('This user already has a password set.');
            break;
          }
          case 'user-has-no-email': {
            toast.error('This user has no email address to invite.');
            break;
          }
          case null: {
            toast.error(
              logAndFormatError(err, 'Sorry, we could not send the invite.'),
            );
          }
        }
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Invite</DialogTitle>
          <DialogDescription>
            Send an invite email to {userData.email}?
          </DialogDescription>
        </DialogHeader>

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
          <Button onClick={handleConfirm} disabled={loading}>
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
