import { useFieldArray } from 'react-hook-form';
import { Alert, Button, LinkButton, TextInput } from 'src/components';
import Dropdown from 'src/components/Dropdown';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useAppConfig } from 'src/hooks/useAppConfig';
import { useStatus } from 'src/hooks/useStatus';
import ModelFieldForm from './ModelFieldForm';
import ModelRelationForm from './ModelRelationForm';
import { useModelForm } from './hooks/useModelForm';

function ModelEditModelPage(): JSX.Element {
  const { status, setError } = useStatus();
  const { form, onFormSubmit } = useModelForm({ setError });
  const { control, handleSubmit } = form;

  const { parsedConfig } = useAppConfig();

  const featureOptions = (parsedConfig.appConfig.features || []).map((f) => ({
    label: f.name,
    value: f.name,
  }));

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <Alert.WithStatus status={status} />
      <TextInput.Controller
        label="Name (e.g. User)"
        control={control}
        name="name"
      />
      <ReactSelectInput.Controller
        label="Feature"
        control={control}
        name="feature"
        options={featureOptions}
      />
      <h3>Fields</h3>
      {fieldFields.map((field, i) => (
        <div key={field.id}>
          <div className="flex flex-row space-x-4">
            <ModelFieldForm
              formProps={form}
              idx={i}
              field={field}
              onRemove={removeField}
            />
          </div>
        </div>
      ))}
      <div className="flex flex-row space-x-4">
        <Dropdown>
          <Dropdown.Button>Add Common Fields</Dropdown.Button>
          <Dropdown.Items>
            <Dropdown.ButtonItem
              onClick={() =>
                appendField({
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
                    name: 'updatedAt',
                    type: 'dateTime',
                    options: {
                      updatedAt: true,
                      defaultToNow: true,
                    },
                  },
                  {
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
          </Dropdown.Items>
        </Dropdown>
        <Button
          secondary
          onClick={() =>
            appendField({
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
            />
          </div>
        </div>
      ))}
      <LinkButton
        onClick={() =>
          appendRelation({
            references: [],
            modelName: '',
            relationshipType: 'oneToMany',
            isOptional: false,
            onDelete: 'Cascade',
            onUpdate: 'Restrict',
          })
        }
      >
        Add Field
      </LinkButton>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export default ModelEditModelPage;
