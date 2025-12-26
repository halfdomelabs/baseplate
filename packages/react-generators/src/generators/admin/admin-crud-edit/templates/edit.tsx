// @ts-nocheck

import type { ReactElement } from 'react';

import { logError } from '%reactErrorImports';
import { useMutation } from '@apollo/client/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

export const Route = createFileRoute(TPL_ROUTE_PATH)({
  component: TPL_COMPONENT_NAME,
  loader: async ({ context: { apolloClient }, params }) => {
    const { id } = params;
    const { data } = await apolloClient.query({
      query: TPL_USER_QUERY,
      variables: { id },
    });
    if (!data) throw new Error('No data received from query');
    return {
      crumb: TPL_CRUMB_EXPRESSION,
    };
  },
});

function TPL_COMPONENT_NAME(): ReactElement {
  const { id } = Route.useParams();
  const { crumb } = Route.useLoaderData();

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
      <h1 className="flex space-x-2">{crumb}</h1>
      <TPL_EDIT_FORM />
    </div>
  );
}
