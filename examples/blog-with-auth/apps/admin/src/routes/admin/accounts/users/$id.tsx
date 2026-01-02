import type { ReactElement } from 'react';

import { useMutation, useSuspenseQuery } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { graphql, readFragment } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import type { UserFormData } from './-schemas/user-schema';

import { UserEditForm } from './-components/user-edit-form';

/* TPL_COMPONENT_NAME=UserEditPage */
/* TPL_FORM_DATA_NAME=UserFormData */

/* TPL_USER_EDIT_FRAGMENT:START */
export const userEditItemFragment = graphql(`
  fragment UserEdit_item on User {
    email
    id
    name
  }
`);
/* TPL_USER_EDIT_FRAGMENT:END */

/* TPL_USER_EDIT_QUERY:START */
export const userEditUserQuery = graphql(
  `
    query UserEditUser($id: Uuid!) {
      user(id: $id) {
        ...UserEdit_item
        name
      }
    }
  `,
  [userEditItemFragment],
);
/* TPL_USER_EDIT_QUERY:END */

const userEditPageUpdateUserMutation = graphql(
  `
    mutation UserEditPageUpdateUser($input: UpdateUserInput!) {
      updateUser(input: $input) {
        user {
          ...UserEdit_item
        }
      }
    }
  `,
  [userEditItemFragment],
);

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/$id' /* TPL_ROUTE_PATH:END */,
)({
  component: UserEditPage,
  loader: async ({ context: { apolloClient }, params }) => {
    const { id } = params;
    const { data } = await apolloClient.query({
      query: userEditUserQuery,
      variables: { id },
    });
    if (!data) throw new Error('No data received from query');
    return {
      crumb: /* TPL_CRUMB_EXPRESSION:START */ data.user.name
        ? data.user.name
        : 'Unnamed User' /* TPL_CRUMB_EXPRESSION:END */,
    };
  },
});

function UserEditPage(): ReactElement {
  const { id } = Route.useParams();
  const { crumb } = Route.useLoaderData();

  /* TPL_DATA_LOADER:START */

  const { data } = useSuspenseQuery(userEditUserQuery, {
    variables: { id },
  });

  const initialData: UserFormData = readFragment(
    userEditItemFragment,
    data.user,
  );

  /* TPL_DATA_LOADER:END */

  const [updateUser] = useMutation(userEditPageUpdateUserMutation);
  const navigate = useNavigate();

  const submitData = async (formData: UserFormData): Promise<void> => {
    try {
      await updateUser({ variables: { input: { id, data: formData } } });
      toast.success('Successfully updated user!');
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(logAndFormatError(err, 'Sorry, we could not update user.'));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">{crumb}</h1>
      {/* TPL_EDIT_FORM:START */}
      <UserEditForm submitData={submitData} initialData={initialData} />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
