import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { graphql } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import type { UserFormData } from './-schemas/user-schema';

import { UserEditForm } from './-components/user-edit-form';

/* TPL_COMPONENT_NAME=UserCreatePage */

/* TPL_CREATE_MUTATION:START */
const userCreatePageCreateMutation = graphql(`
  mutation UserCreatePageCreate($input: CreateUserInput!) {
    createUser(input: $input) {
      user {
        id
      }
    }
  }
`);
/* TPL_CREATE_MUTATION:END */

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/new' /* TPL_ROUTE_PATH:END */,
)({
  component: UserCreatePage,
  loader: () => ({
    crumb: 'New',
  }),
});

function UserCreatePage(): ReactElement {
  /* TPL_DATA_LOADER:BLOCK */

  /* TPL_MUTATION_HOOK:START */
  const [createUser] = useMutation(userCreatePageCreateMutation, {
    update: (cache) => {
      cache.evict({ fieldName: 'users' });
      cache.gc();
    },
  });
  /* TPL_MUTATION_HOOK:END */
  const navigate = useNavigate();

  const submitData = async (
    formData: /* TPL_FORM_DATA_NAME:START */ UserFormData /* TPL_FORM_DATA_NAME:END */,
  ): Promise<void> => {
    try {
      await createUser({ variables: { input: { data: formData } } });
      toast.success(
        /* TPL_MUTATION_SUCCESS_MESSAGE:START */ 'Successfully created user!' /* TPL_MUTATION_SUCCESS_MESSAGE:END */,
      );
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(
        logAndFormatError(
          err,
          /* TPL_MUTATION_ERROR_MESSAGE:START */ 'Sorry, we could not create user.' /* TPL_MUTATION_ERROR_MESSAGE:END */,
        ),
      );
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <span>
          New {/* TPL_MODEL_NAME:START */}
          User
          {/* TPL_MODEL_NAME:END */}
        </span>
      </h1>
      {/* TPL_EDIT_FORM:START */}
      <UserEditForm submitData={submitData} defaultValues={undefined} />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
