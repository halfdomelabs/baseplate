import {
  ModelUtils,
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useParams } from 'react-router-dom';

import { ModelGeneralForm } from './ModelGeneralForm';
import ModelPrimaryKeyForm from './ModelPrimaryKeyForm';
import { ModelRelationsForm } from './ModelRelationsForm';
import ModelUniqueConstraintsField from './ModelUniqueConstraintsField';
import { ModelFieldsForm } from './fields/ModelFieldsForm';
import ModelFormActionBar from '../ModelFormActionBar';
import { EditedModelContextProvider } from '../hooks/useEditedModelConfig';
import { useModelForm } from '../hooks/useModelForm';
import { usePreventDirtyForm } from 'src/hooks/usePreventDirtyForm';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { registerEntityTypeUrl } from 'src/services/entity-type';

registerEntityTypeUrl(modelEntityType, `/models/edit/{uid}`);
registerEntityTypeUrl(modelScalarFieldEntityType, `/models/edit/{parentUid}`);
registerEntityTypeUrl(modelLocalRelationEntityType, `/models/edit/{parentUid}`);

function ModelEditModelPage(): JSX.Element {
  const { form, onFormSubmit, defaultValues } = useModelForm({});
  const { control, handleSubmit, watch, getValues } = form;

  const { config } = useProjectConfig();

  const { uid } = useParams<'uid'>();
  const id = modelEntityType.fromUid(uid);
  const originalModel = id ? ModelUtils.byId(config, id) : undefined;

  usePreventDirtyForm(form);

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
