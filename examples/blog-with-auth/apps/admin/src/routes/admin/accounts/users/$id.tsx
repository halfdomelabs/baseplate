import type { ReactElement } from 'react';

import { useMutation, useReadQuery } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { graphql } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import type { UserFormData } from './-schemas/user-schema';

import {
  UserEditForm,
  userEditFormDefaultValuesFragment,
} from './-components/user-edit-form';

/* TPL_COMPONENT_NAME=UserEditPage */
/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_UPDATE_MUTATION_FIELD_NAME=updateUser */
/* TPL_UPDATE_MUTATION_VARIABLE=userEditPageUpdateMutation */

/* TPL_EDIT_QUERY:START */
const userEditPageQuery = graphql(
  `
    query UserEditPage($id: Uuid!) {
      user(id: $id) {
        id
        name
        ...UserEditForm_defaultValues
      }
    }
  `,
  [userEditFormDefaultValuesFragment],
);
/* TPL_EDIT_QUERY:END */

/* TPL_UPDATE_MUTATION:START */
const userEditPageUpdateMutation = graphql(
  `
    mutation UserEditPageUpdate($input: UpdateUserInput!) {
      updateUser(input: $input) {
        user {
          id
          name
          ...UserEditForm_defaultValues
        }
      }
    }
  `,
  [userEditFormDefaultValuesFragment],
);
/* TPL_UPDATE_MUTATION:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/$id' /* TPL_ROUTE_PATH:END */,
)({
  component: UserEditPage,
  /* TPL_ROUTE_PROPS:START */ loader: ({
    context: { preloadQuery, apolloClient },
    params: { id },
  }) => ({
    crumb: apolloClient
      .query({
        query: userEditPageQuery,
        variables: { id },
      })
      .then(({ data }) => (data?.user.name ? data.user.name : 'Edit User'))
      .catch(() => 'Edit User'),
    queryRef: preloadQuery(userEditPageQuery, { variables: { id } }),
  }) /* TPL_ROUTE_PROPS:END */,
});

function UserEditPage(): ReactElement {
  const { id } = Route.useParams();

  /* TPL_DATA_LOADER:START */
  const { queryRef, crumb } = Route.useLoaderData();

  const { data } = useReadQuery(queryRef);
  /* TPL_DATA_LOADER:END */

  const [updateUser] = useMutation(userEditPageUpdateMutation);
  const navigate = useNavigate();

  const submitData = async (formData: UserFormData): Promise<void> => {
    try {
      await updateUser({
        variables: { input: { id, data: formData } },
      });
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
      <UserEditForm submitData={submitData} defaultValues={data.user} />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
