import { useParams } from 'react-router-dom';

import { ModelGeneralForm } from './ModelGeneralForm';
import ModelPrimaryKeyForm from './ModelPrimaryKeyForm';
import { ModelRelationsForm } from './ModelRelationsForm';
import ModelUniqueConstraintsField from './ModelUniqueConstraintsField';
import { ModelFieldsForm } from './fields/ModelFieldsForm';
import ModelFormActionBar from '../ModelFormActionBar';
import { EditedModelContextProvider } from '../hooks/useEditedModelConfig';
import { useModelForm } from '../hooks/useModelForm';
import { Alert } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';

function ModelEditModelPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit, fixControlledReferences, defaultValues } =
    useModelForm({
      setError,
      controlledReferences: [
        'modelPrimaryKey',
        'modelLocalRelation',
        'modelUniqueConstraint',
      ],
    });
  const { control, handleSubmit, watch, formState } = form;

  console.log(formState.errors);

  const { parsedProject } = useProjectConfig();

  const { id } = useParams<'id'>();
  const originalModel = id
    ? parsedProject.getModels().find((m) => m.uid === id)
    : undefined;

  return (
    <EditedModelContextProvider initialModel={defaultValues} watch={watch}>
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="min-w-[700px] max-w-6xl space-y-4"
      >
        <Alert.WithStatus status={status} />
        {!id && <ModelGeneralForm control={control} horizontal />}
        {!id && <h2>Fields</h2>}
        <ModelFieldsForm
          control={control}
          fixReferences={fixControlledReferences}
          originalModel={originalModel}
        />
        <ModelRelationsForm control={control} originalModel={originalModel} />
        <ModelPrimaryKeyForm control={control} />
        <ModelUniqueConstraintsField control={control} />
        <ModelFormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditModelPage;
