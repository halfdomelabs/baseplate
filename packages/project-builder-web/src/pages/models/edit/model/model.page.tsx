import {
  ModelUtils,
  modelEntityType,
  modelLocalRelationEntityType,
  modelScalarFieldEntityType,
} from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { useBlockDirtyFormNavigate } from '@halfdomelabs/project-builder-lib/web';
import { useParams } from 'react-router-dom';

import { ModelGeneralForm } from './ModelGeneralForm';
import ModelPrimaryKeyForm from './ModelPrimaryKeyForm';
import { ModelRelationsForm } from './ModelRelationsForm';
import ModelUniqueConstraintsField from './ModelUniqueConstraintsField';
import { ModelFieldsForm } from './fields/ModelFieldsForm';
import ModelFormActionBar from '../ModelFormActionBar';
import { EditedModelContextProvider } from '../hooks/useEditedModelConfig';
import { useModelForm } from '../hooks/useModelForm';
import { registerEntityTypeUrl } from 'src/services/entity-type';

registerEntityTypeUrl(modelEntityType, `/models/edit/{uid}`);
registerEntityTypeUrl(modelScalarFieldEntityType, `/models/edit/{parentUid}`);
registerEntityTypeUrl(modelLocalRelationEntityType, `/models/edit/{parentUid}`);

function ModelEditModelPage(): JSX.Element {
  const { form, onFormSubmit, defaultValues } = useModelForm({});
  const { control, handleSubmit, watch, getValues, setValue } = form;
  const { definition } = useProjectDefinition();
  const { uid } = useParams<'uid'>();

  const id = modelEntityType.fromUid(uid);
  const originalModel = id ? ModelUtils.byId(definition, id) : undefined;

  useBlockDirtyFormNavigate(form.formState, form.reset);

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
        <ModelFieldsForm control={control} setValue={setValue} />
        <ModelRelationsForm control={control} originalModel={originalModel} />
        <ModelPrimaryKeyForm control={control} />
        <ModelUniqueConstraintsField control={control} />
        <ModelFormActionBar form={form} />
      </form>
    </EditedModelContextProvider>
  );
}

export default ModelEditModelPage;
