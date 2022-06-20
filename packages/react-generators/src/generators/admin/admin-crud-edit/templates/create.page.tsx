// @ts-nocheck

import { BackButton } from '%react-components';
import { useToast } from '%react-components/useToast';
import { useNavigate } from 'react-router-dom';

function COMPONENT_NAME(): JSX.Element {
  DATA_LOADER;

  const [MUTATION_NAME] = CREATE_MUTATION({
    refetchQueries: [{ query: REFETCH_DOCUMENT }],
  });

  const toast = useToast();
  const navigate = useNavigate();

  const submitData = async (formData: FORM_DATA_NAME): Promise<void> => {
    await MUTATION_NAME({
      variables: { input: { data: formData } },
    });
    toast.success('Successfully created item!');
    navigate('..');
  };

  DATA_GATE;

  return (
    <div className="space-y-4">
      <h1 className="flex space-x-2">
        <BackButton />
        <span>Create New MODEL_NAME</span>
      </h1>
      <EDIT_FORM />
    </div>
  );
}

export default COMPONENT_NAME;
