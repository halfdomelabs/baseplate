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
  const { id } = Route.useParams();

  TPL_DATA_LOADER;

  const [TPL_MUTATION_NAME] = useMutation(TPL_UPDATE_MUTATION);
  const navigate = useNavigate();

  TPL_DATA_GATE;

  const submitData = async (formData: TPL_FORM_DATA_NAME): Promise<void> => {
    await TPL_MUTATION_NAME({
      variables: { input: { id, data: formData } },
    });
    toast.success('Successfully updated item!');
    navigate({ to: '..' }).catch(logError);
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <span>
          Edit <TPL_MODEL_NAME /> ({id})
        </span>
      </h1>
      <TPL_EDIT_FORM />
    </div>
  );
}
