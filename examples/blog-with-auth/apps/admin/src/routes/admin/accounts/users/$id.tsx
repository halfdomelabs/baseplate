import type { ReactElement } from 'react';

import { useMutation, useQuery } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import { graphql, readFragment } from '@src/graphql';
import { logError } from '@src/services/error-logger';

import type { UserFormData } from './-schemas/user-schema';

import { UserEditForm } from './-components/user-edit-form';

/* TPL_COMPONENT_NAME=UserEditPage */
/* TPL_FORM_DATA_NAME=UserFormData */

/* TPL_USER_EDIT_FRAGMENT:START */
export const userEditFragment = graphql(`
  fragment UserEdit on User {
    email
    id
    name
  }
`);
/* TPL_USER_EDIT_FRAGMENT:END */

/* TPL_USER_EDIT_QUERY:START */
export const userEditByIdQuery = graphql(
  `
    query UserEditById($id: Uuid!) {
      user(id: $id) {
        ...UserEdit
      }
    }
  `,
  [userEditFragment],
);
/* TPL_USER_EDIT_QUERY:END */

/* TPL_UPDATE_USER_MUTATION:START */
const updateUserMutation = graphql(
  `
    mutation UpdateUser($input: UpdateUserInput!) {
      updateUser(input: $input) {
        user {
          ...UserEdit
        }
      }
    }
  `,
  [userEditFragment],
);
/* TPL_UPDATE_USER_MUTATION:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/$id' /* TPL_ROUTE_PATH:END */,
)({
  component: UserEditPage,
  loader: async ({ context: { apolloClient }, params }) => {
    const { id } = params;
    const { data } = await apolloClient.query({
      query: userEditByIdQuery,
      variables: { id },
    });
    if (!data) throw new Error('No data received from query');
    const user = readFragment(userEditFragment, data.user);
    return {
      crumb: /* TPL_CRUMB_EXPRESSION:START */ user.name
        ? user.name
        : 'Unnamed User' /* TPL_CRUMB_EXPRESSION:END */,
    };
  },
});

function UserEditPage(): ReactElement {
  const { id } = Route.useParams();
  const { crumb } = Route.useLoaderData();

  /* TPL_DATA_LOADER:START */

  const { data, error } = useQuery(userEditByIdQuery, {
    variables: { id },
  });

  const initialData: UserFormData | undefined = useMemo(() => {
    if (!data?.user) return undefined;
    return readFragment(userEditFragment, data.user);
  }, [data]);

  /* TPL_DATA_LOADER:END */

  const [/* TPL_MUTATION_NAME:START */ updateUser /* TPL_MUTATION_NAME:END */] =
    useMutation(
      /* TPL_UPDATE_MUTATION:START */ updateUserMutation /* TPL_UPDATE_MUTATION:END */,
    );
  const navigate = useNavigate();

  /* TPL_DATA_GATE:START */
  if (!initialData) {
    return <ErrorableLoader error={error} />;
  }
  /* TPL_DATA_GATE:END */

  const submitData = async (formData: UserFormData): Promise<void> => {
    await /* TPL_MUTATION_NAME:START */ updateUser(
      /* TPL_MUTATION_NAME:END */ {
        variables: { input: { id, data: formData } },
      },
    );
    toast.success('Successfully updated item!');
    navigate({ to: '..' }).catch(logError);
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
