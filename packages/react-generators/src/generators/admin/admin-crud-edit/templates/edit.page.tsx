// @ts-nocheck

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, ErrorableLoader } from '%react-components';
import { useToast } from '%react-components/useToast';

function COMPONENT_NAME(): JSX.Element {
  const { id } = useParams() as { id: string };

  DATA_LOADER;

  const [MUTATION_NAME] = UPDATE_MUTATION();
  const toast = useToast();
  const navigate = useNavigate();

  DATA_GATE;

  const submitData = async (formData: FORM_DATA_NAME): Promise<void> => {
    await MUTATION_NAME({
      variables: { input: { id, data: formData } },
    });
    toast.success('Successfully updated item!');
    navigate('..');
  };

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <BackButton />
        <span>Edit MODEL_NAME ({id})</span>
      </h1>
      <EDIT_FORM />
    </div>
  );
}

export default COMPONENT_NAME;
