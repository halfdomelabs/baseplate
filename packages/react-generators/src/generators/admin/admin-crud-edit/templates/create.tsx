// @ts-nocheck

import type { ReactElement } from 'react';

import { logAndFormatError, logError } from '%reactErrorImports';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

TPL_CREATE_MUTATION;

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: TPL_COMPONENT_NAME,
  loader: () => ({
    crumb: 'New',
  }),
});

function TPL_COMPONENT_NAME(): ReactElement {
  TPL_DATA_LOADER;

  TPL_MUTATION_HOOK;
  const navigate = useNavigate();

  const submitData = async (formData: TPL_FORM_DATA_NAME): Promise<void> => {
    try {
      await TPL_CREATE_MUTATION_FIELD_NAME({
        variables: { input: { data: formData } },
      });
      toast.success(TPL_MUTATION_SUCCESS_MESSAGE);
      navigate({ to: '..' }).catch(logError);
    } catch (err: unknown) {
      toast.error(logAndFormatError(err, TPL_MUTATION_ERROR_MESSAGE));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <span>
          New <TPL_MODEL_NAME />
        </span>
      </h1>
      <TPL_EDIT_FORM />
    </div>
  );
}
