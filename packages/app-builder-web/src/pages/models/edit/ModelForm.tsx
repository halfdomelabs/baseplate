import { ModelConfig } from '@baseplate/app-builder-lib';
import classNames from 'classnames';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Button, LinkButton } from 'src/components';
import Dropdown from 'src/components/Dropdown';
import ModelFieldForm from './ModelFieldForm';
import ModelRelationForm from './ModelRelationForm';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
}

function ModelForm({ className, formProps }: Props): JSX.Element {
  const { control } = formProps;
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
    <div className={classNames('space-y-4', className)}>
      <h3>Fields</h3>
      {fieldFields.map((field, i) => (
        <div key={field.id}>
          <div className="flex flex-row space-x-4">
            <ModelFieldForm
              formProps={formProps}
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
              formProps={formProps}
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
    </div>
  );
}

export default ModelForm;
