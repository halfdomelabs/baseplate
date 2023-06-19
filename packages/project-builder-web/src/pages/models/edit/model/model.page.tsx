import { randomUid } from '@halfdomelabs/project-builder-lib';
import { useFieldArray } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { Alert, Button, LinkButton } from 'src/components';
import Dropdown from 'src/components/Dropdown';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { useStatus } from 'src/hooks/useStatus';
import { useModelForm } from '../hooks/useModelForm';
import ModelFieldForm from './ModelFieldForm';
import { ModelGeneralForm } from './ModelGeneralForm';
import ModelPrimaryKeyForm from './ModelPrimaryKeyForm';
import ModelRelationForm from './ModelRelationForm';
import ModelUniqueConstraintsField from './ModelUniqueConstraintsField';

function ModelEditModelPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit } = useModelForm({
    setError,
    ignoredReferences: [
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
    fields: fieldFields,
    remove: removeField,
    append: appendField,
  } = useFieldArray({
    control,
    name: 'model.fields',
  });

  const {
    fields: relationFields,
    remove: removeRelation,
    append: appendRelation,
  } = useFieldArray({
    control,
    name: 'model.relations',
  });

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="max-w-4xl space-y-4">
      <Alert.WithStatus status={status} />
      {!id && <ModelGeneralForm control={control} />}
      <h2>Fields</h2>
      {fieldFields.map((field, i) => (
        <div key={field.id}>
          <div className="flex flex-row space-x-4">
            <ModelFieldForm
              formProps={form}
              idx={i}
              field={field}
              onRemove={removeField}
              originalModel={originalModel}
            />
          </div>
        </div>
      ))}
      <div className="flex flex-row space-x-4">
        <Dropdown buttonLabel="Add Common Fields">
          <Dropdown.ButtonItem
            onClick={() =>
              appendField({
                uid: randomUid(),
                name: 'id',
                type: 'uuid',
                isId: true,
                options: {
                  genUuid: true,
                },
              })
            }
          >
            id (uuid)
          </Dropdown.ButtonItem>
          <Dropdown.ButtonItem
            onClick={() =>
              appendField([
                {
                  uid: randomUid(),
                  name: 'updatedAt',
                  type: 'dateTime',
                  options: {
                    updatedAt: true,
                    defaultToNow: true,
                  },
                },
                {
                  uid: randomUid(),
                  name: 'createdAt',
                  type: 'dateTime',
                  options: {
                    defaultToNow: true,
                  },
                },
              ])
            }
          >
            Timestamps
          </Dropdown.ButtonItem>
        </Dropdown>
        <Button
          color="light"
          onClick={() =>
            appendField({
              uid: randomUid(),
              name: '',
              type: 'string',
            })
          }
        >
          Add Field
        </Button>
      </div>
      <h3>Relations</h3>
      {relationFields.map((field, i) => (
        <div key={field.id}>
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
            relationshipType: 'oneToMany',
            isOptional: false,
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
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export default ModelEditModelPage;
