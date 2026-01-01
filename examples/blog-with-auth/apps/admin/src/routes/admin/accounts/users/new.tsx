import type { ReactElement } from 'react';

import { useMutation } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

import { graphql } from '@src/graphql';
import { logAndFormatError } from '@src/services/error-formatter';
import { logError } from '@src/services/error-logger';

import type { UserFormData } from './-schemas/user-schema';

import { UserEditForm } from './-components/user-edit-form';

const userCreatePageCreateUserMutation = graphql(`
  mutation UserCreatePageCreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      user {
        id
      }
    }
  }
`);

export const Route = createFileRoute(
  /* TPL_ROUTE_PATH:START */ '/admin/accounts/users/new' /* TPL_ROUTE_PATH:END */,
)({
  component:
    /* TPL_COMPONENT_NAME:START */ UserCreatePage /* TPL_COMPONENT_NAME:END */,
  loader: () => ({
    crumb: 'New',
  }),
});

function /* TPL_COMPONENT_NAME:START */ UserCreatePage /* TPL_COMPONENT_NAME:END */(): ReactElement {
  /* TPL_DATA_LOADER:BLOCK */

  const [createUser] = useMutation(userCreatePageCreateUserMutation, {
    update: (cache) => {
      cache.evict({ fieldName: 'users' });
      cache.gc();
    },
  });
  const navigate = useNavigate();

  const submitData = async (
    formData: /* TPL_FORM_DATA_NAME:START */ UserFormData /* TPL_FORM_DATA_NAME:END */,
  ): Promise<void> => {
    try {
      await createUser({ variables: { input: { data: formData } } });
      toast.success('Successfully created user!');
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(logAndFormatError(err, 'Sorry, we could not create user.'));
    }
  };

  /* TPL_DATA_GATE:BLOCK */

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <span>
          Create New {/* TPL_MODEL_NAME:START */}
          User
          {/* TPL_MODEL_NAME:END */}
        </span>
      </h1>
      {/* TPL_EDIT_FORM:START */}
      <UserEditForm submitData={submitData} />
      {/* TPL_EDIT_FORM:END */}
    </div>
  );
}
