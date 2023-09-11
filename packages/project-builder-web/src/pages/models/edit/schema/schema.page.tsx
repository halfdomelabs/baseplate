import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { useMemo } from 'react';
import { Alert, Button } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import CheckedInput from 'src/components/CheckedInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';
import { useModelForm } from '../hooks/useModelForm';

function ModelEditSchemaPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit, originalModel } = useModelForm({ setError });
  const { control, handleSubmit, watch } = form;
  const { parsedProject } = useProjectConfig();

  const onSubmit = (data: ModelConfig): void => {
    onFormSubmit(data);
  };

  const localFields = watch(`model.fields`);
  const localFieldOptions = localFields.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  const localRelations = watch(`model.relations`);
  const localRelationOptions = localRelations?.map((f) => ({
    label: f.name,
    value: f.name,
  }));

  const foreignRelations = useMemo(
    () =>
      parsedProject.getModels().flatMap(
        (model) =>
          model.model.relations
            ?.filter((relation) => relation.modelName === originalModel?.name)
            .map((relation) => ({
              model,
              relation,
            })) ?? []
      ),
    [parsedProject, originalModel]
  );
  const foreignRelationOptions = foreignRelations?.map((f) => ({
    label: f.relation.foreignRelationName,
    value: f.relation.foreignRelationName,
  }));

  const roleOptions = parsedProject.projectConfig.auth?.roles.map((role) => ({
    label: role.name,
    value: role.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Alert.WithStatus status={status} />
      <CheckedInput.LabelledController
        label="Build Object Type?"
        control={control}
        name="schema.buildObjectType"
      />
      <CheckedArrayInput.LabelledController
        label="Exposed Fields"
        control={control}
        options={localFieldOptions}
        name="schema.exposedFields"
      />
      {!localRelationOptions?.length ? null : (
        <CheckedArrayInput.LabelledController
          label="Exposed Local Relations"
          control={control}
          options={localRelationOptions}
          name="schema.exposedLocalRelations"
        />
      )}
      {!foreignRelationOptions?.length ? null : (
        <CheckedArrayInput.LabelledController
          label="Exposed Foreign Relations"
          control={control}
          options={foreignRelationOptions}
          name="schema.exposedForeignRelations"
        />
      )}
      <CheckedInput.LabelledController
        label="Build Query?"
        control={control}
        name="schema.buildQuery"
      />
      <CheckedInput.LabelledController
        label="Build Mutations?"
        control={control}
        name="schema.buildMutations"
      />
      <h3>Permissions</h3>
      {roleOptions && (
        <>
          <CheckedArrayInput.LabelledController
            label="Read"
            control={control}
            options={roleOptions}
            name="schema.authorize.read"
          />
          <CheckedArrayInput.LabelledController
            label="Create"
            control={control}
            options={roleOptions}
            name="schema.authorize.create"
          />
          <CheckedArrayInput.LabelledController
            label="Update"
            control={control}
            options={roleOptions}
            name="schema.authorize.update"
          />
          <CheckedArrayInput.LabelledController
            label="Delete"
            control={control}
            options={roleOptions}
            name="schema.authorize.delete"
          />
        </>
      )}
      <Button type="submit">Save</Button>
    </form>
  );
}

export default ModelEditSchemaPage;
