// @ts-nocheck

import type { ReactElement } from 'react';

import { logError } from '%reactErrorImports';
import { useMutation } from '@apollo/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: TPL_COMPONENT_NAME,
});

function TPL_COMPONENT_NAME(): ReactElement {
  TPL_DATA_LOADER;

  const [TPL_MUTATION_NAME] = useMutation(TPL_CREATE_MUTATION, {
    refetchQueries: [
      {
        query: TPL_REFETCH_DOCUMENT,
      },
    ],
  });

  const navigate = useNavigate();

  const submitData = async (formData: TPL_FORM_DATA_NAME): Promise<void> => {
    await TPL_MUTATION_NAME({
      variables: { input: { data: formData } },
    });
    toast.success('Successfully created item!');
    navigate({ to: '..' }).catch(logError);
  };

  TPL_DATA_GATE;

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <span>
          Create New <TPL_MODEL_NAME />
        </span>
      </h1>
      <TPL_EDIT_FORM />
    </div>
  );
}
