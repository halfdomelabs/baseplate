import type { ReactElement } from 'react';

import { useMutation, useReadQuery } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { graphql, readFragment } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import type { UserFormData } from './-schemas/user-schema';

import { UserEditForm } from './-components/user-edit-form';

/* TPL_COMPONENT_NAME=UserEditPage */
/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_UPDATE_MUTATION_NAME=userEditPageUpdateUserMutation */
/* TPL_UPDATE_OPERATION_NAME=updateUser */
/* TPL_ROUTE_PATH=/admin/accounts/users/$id */

/* TPL_EDIT_FRAGMENT:START */
export const userEditItemFragment = graphql(`
  fragment UserEdit_item on User {
    email
    id
    name
  }
`);
/* TPL_EDIT_FRAGMENT:END */

/* TPL_EDIT_QUERY:START */
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
/* TPL_EDIT_QUERY:END */

/* TPL_UPDATE_MUTATION:START */
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
/* TPL_UPDATE_MUTATION:END */

export const Route = createFileRoute('/admin/accounts/users/$id')({
  component: UserEditPage,
  /* TPL_ROUTE_LOADER:START */
  loader: ({ context: { apolloClient, preloadQuery }, params: { id } }) => ({
    queryRef: preloadQuery(userEditUserQuery, { variables: { id } }),
    crumb: apolloClient
      .query({
        query: userEditUserQuery,
        variables: { id },
      })
      .then(({ data }) => (data?.user.name ? data.user.name : 'Edit User'))
      .catch(() => 'Edit User'),
  }),
  /* TPL_ROUTE_LOADER:END */
});

function UserEditPage(): ReactElement {
  const { id } = Route.useParams();
  const { crumb, queryRef } = Route.useLoaderData();

  /* TPL_DATA_LOADER:START */
  const { data } = useReadQuery(queryRef);

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
      toast.success(
        /* TPL_MUTATION_SUCCESS_MESSAGE:START */ 'Successfully updated user!' /* TPL_MUTATION_SUCCESS_MESSAGE:END */,
      );
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(
        logAndFormatError(
          err,
          /* TPL_MUTATION_ERROR_MESSAGE:START */ 'Sorry, we could not update user.' /* TPL_MUTATION_ERROR_MESSAGE:END */,
        ),
      );
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
