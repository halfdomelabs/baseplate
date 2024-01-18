import { ModelUtils, modelEntityType } from '@halfdomelabs/project-builder-lib';
import { useParams } from 'react-router-dom';

import { ModelGeneralForm } from './ModelGeneralForm';
import ModelPrimaryKeyForm from './ModelPrimaryKeyForm';
import { ModelRelationsForm } from './ModelRelationsForm';
import ModelUniqueConstraintsField from './ModelUniqueConstraintsField';
import { ModelFieldsForm } from './fields/ModelFieldsForm';
import ModelFormActionBar from '../ModelFormActionBar';
import { EditedModelContextProvider } from '../hooks/useEditedModelConfig';
import { useModelForm } from '../hooks/useModelForm';
import { registerEntityTypeUrl } from '@src/services/entity-type';
import { Alert } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';

registerEntityTypeUrl(modelEntityType, `/models/edit/{uid}`);

function ModelEditModelPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit, defaultValues } = useModelForm({
    setError,
  });
  const { control, handleSubmit, watch, getValues } = form;

  const { config } = useProjectConfig();

  const { uid } = useParams<'uid'>();
  const id = modelEntityType.fromUid(uid);
  const originalModel = id ? ModelUtils.byId(config, id) : undefined;

  return (
    <EditedModelContextProvider
      initialModel={defaultValues}
      getValues={getValues}
      watch={watch}
    >
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className="min-w-[700px] max-w-6xl space-y-4"
      >
        <Alert.WithStatus status={status} />
        {!id && <ModelGeneralForm control={control} horizontal />}
        {!id && <h2>Fields</h2>}
        <ModelFieldsForm control={control} />
        <ModelRelationsForm control={control} originalModel={originalModel} />
        <ModelPrimaryKeyForm control={control} />
        <ModelUniqueConstraintsField control={control} />
        <ModelFormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditModelPage;
