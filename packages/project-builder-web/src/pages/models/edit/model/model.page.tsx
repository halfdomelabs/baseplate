import {
  ModelRelationFieldConfig,
  randomUid,
} from '@halfdomelabs/project-builder-lib';
import { useController } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import ModelFormActionBar from './ModelFormActionBar';
import { ModelGeneralForm } from './ModelGeneralForm';
import ModelPrimaryKeyForm from './ModelPrimaryKeyForm';
import ModelRelationForm from './ModelRelationForm';
import ModelUniqueConstraintsField from './ModelUniqueConstraintsField';
import { ModelFieldsForm } from './fields/ModelFieldsForm';
import { useModelForm } from '../hooks/useModelForm';
import { Alert, LinkButton } from 'src/components';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';

function ModelEditModelPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit, fixControlledReferences } = useModelForm({
    setError,
    controlledReferences: [
      'modelPrimaryKey',
      'modelLocalRelation',
      'modelUniqueConstraint',
    ],
  });
  const { control, handleSubmit } = form;

  const { parsedProject } = useProjectConfig();

  const { id } = useParams<'id'>();
  const originalModel = id
    ? parsedProject.getModels().find((m) => m.uid === id)
    : undefined;

  const {
    field: { value: relationFields = [], onChange: relationOnChange },
  } = useController({
    name: 'model.relations',
    control,
  });

  const removeRelation = (idx: number): void => {
    relationOnChange(relationFields.filter((_, i) => i !== idx));
  };

  const appendRelation = (relation: ModelRelationFieldConfig): void => {
    relationOnChange([...relationFields, relation]);
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="min-w-[700px] max-w-6xl space-y-4 pb-[56px]"
    >
      <Alert.WithStatus status={status} />
      {!id && <ModelGeneralForm control={control} horizontal />}
      {!id && <h2>Fields</h2>}
      <ModelFieldsForm
        control={control}
        fixReferences={fixControlledReferences}
        originalModel={originalModel}
      />
      <div>
        <h2>Relations</h2>
        <div className="text-xs text-muted-foreground">
          You can modify the relations individually if you have more complex
          relations, e.g. relations over more than one field
        </div>
      </div>
      {relationFields.map((field, i) => (
        <div key={field.uid}>
          <div className="flex flex-row space-x-4">
            <ModelRelationForm
              formProps={form}
              idx={i}
              field={field}
              onRemove={removeRelation}
              originalModel={originalModel}
            />
          </div>
        </div>
      ))}
      <LinkButton
        onClick={() =>
          appendRelation({
            uid: randomUid(),
            name: '',
            references: [{ local: '', foreign: '' }],
            modelName: '',
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
            foreignRelationName: '',
          })
        }
      >
        Add Relation
      </LinkButton>
      <ModelPrimaryKeyForm formProps={form} />
      <ModelUniqueConstraintsField formProps={form} />
      <ModelFormActionBar form={form} />
    </form>
  );
}

export default ModelEditModelPage;
