// @ts-nocheck

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, ErrorableLoader } from '%reactComponentsImports';
import { useToast } from '%reactComponentsImports';

function TPL_COMPONENT_NAME(): JSX.Element {
  const { id } = useParams() as { id: string };

  TPL_DATA_LOADER;

  const [TPL_MUTATION_NAME] = TPL_UPDATE_MUTATION();
  const toast = useToast();
  const navigate = useNavigate();

  TPL_DATA_GATE;

  const submitData = async (formData: TPL_FORM_DATA_NAME): Promise<void> => {
    await TPL_MUTATION_NAME({
      variables: { input: { id, data: formData } },
    });
    toast.success('Successfully updated item!');
    navigate('..');
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <BackButton />
        <span>Edit TPL_MODEL_NAME ({id})</span>
      </h1>
      <TPL_EDIT_FORM />
    </div>
  );
}

export default TPL_COMPONENT_NAME;
