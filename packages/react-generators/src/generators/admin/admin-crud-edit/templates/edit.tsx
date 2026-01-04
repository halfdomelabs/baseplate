// @ts-nocheck

import type { ReactElement } from 'react';

import { logAndFormatError, logError } from '%reactErrorImports';
import { useMutation } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

TPL_EDIT_QUERY;

TPL_UPDATE_MUTATION;

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: TPL_COMPONENT_NAME,
  TPL_ROUTE_PROPS,
});

function TPL_COMPONENT_NAME(): ReactElement {
  const { id } = Route.useParams();

  TPL_DATA_LOADER;

  const [TPL_UPDATE_MUTATION_NAME] = useMutation(TPL_UPDATE_MUTATION_VARIABLE);
  const navigate = useNavigate();

  const submitData = async (formData: TPL_FORM_DATA_NAME): Promise<void> => {
    try {
      await TPL_UPDATE_MUTATION_NAME({
        variables: { input: { id, data: formData } },
      });
      toast.success(TPL_MUTATION_SUCCESS_MESSAGE);
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(logAndFormatError(err, TPL_MUTATION_ERROR_MESSAGE));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">{crumb}</h1>
      <TPL_EDIT_FORM />
    </div>
  );
}
