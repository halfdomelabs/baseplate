import type { ReactElement } from 'react';

import { useMutation, useQuery } from '@apollo/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { ErrorableLoader } from '@src/components/ui/errorable-loader';
import {
  UpdateUserDocument,
  UserEditByIdDocument,
} from '@src/generated/graphql';
import { logError } from '@src/services/error-logger';

import type { UserFormData } from './-schemas/user-schema';

import { UserEditForm } from './-components/user-edit-form';

/* TPL_COMPONENT_NAME=UserEditPage */
/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_USER_QUERY=UserEditByIdDocument */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/$id' /* TPL_ROUTE_PATH:END */,
)({
  component: UserEditPage,
  loader: async ({ context: { apolloClient }, params }) => {
    const { id } = params;
    const { data } = await apolloClient.query({
      query: UserEditByIdDocument,
      variables: { id },
    });
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

  const { data, error } = useQuery(UserEditByIdDocument, {
    variables: { id },
  });

  const initialData: UserFormData | undefined = useMemo(() => {
    if (!data?.user) return undefined;
    return data.user;
  }, [data]);

  /* TPL_DATA_LOADER:END */

  const [/* TPL_MUTATION_NAME:START */ updateUser /* TPL_MUTATION_NAME:END */] =
    useMutation(
      /* TPL_UPDATE_MUTATION:START */ UpdateUserDocument /* TPL_UPDATE_MUTATION:END */,
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
