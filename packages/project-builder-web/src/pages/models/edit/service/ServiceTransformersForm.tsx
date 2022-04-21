import { ModelConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { LinkButton } from 'src/components';
import Dropdown from 'src/components/Dropdown';
import ServiceEmbeddedRelationForm from './ServiceEmbeddedRelationForm';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
  originalModel: ModelConfig;
}

function ServiceEmbeddedRelationsForm({
  className,
  formProps,
  originalModel,
}: Props): JSX.Element {
  const { control } = formProps;
  const { fields, remove, append } = useFieldArray({
    control,
    name: `service.transformers`,
  });

  return (
    <div className={classNames('space-y-4', className)}>
      <h2>Transformers</h2>
      {!fields.length && <div>No transformers</div>}
      {fields.map((field, idx) => {
        switch (field.type) {
          case 'embeddedRelation':
            return (
              <ServiceEmbeddedRelationForm
                key={field.id}
                formProps={formProps}
                onRemove={() => remove(idx)}
                idx={idx}
                originalModel={originalModel}
              />
            );
          case 'password':
            return (
              <div className="flex flex-row space-x-4" key={field.id}>
                <div>
                  <strong>Password Transformer</strong>
                </div>
                <LinkButton onClick={() => remove(idx)}>Remove</LinkButton>
              </div>
            );
          default:
            return (
              <div key={(field as { id: string }).id}>
                Unknown transformer type {(field as { type: string }).type}
                <LinkButton onClick={() => remove(idx)}>Remove</LinkButton>
              </div>
            );
        }
      })}
      <Dropdown buttonLabel="Add Transformer">
        {!fields.some((f) => f.type === 'password') && (
          <Dropdown.ButtonItem
            onClick={() => append({ name: 'password', type: 'password' })}
          >
            Password
          </Dropdown.ButtonItem>
        )}
        <Dropdown.ButtonItem
          onClick={() => append({ type: 'embeddedRelation' })}
        >
          Embedded Relation
        </Dropdown.ButtonItem>
      </Dropdown>
    </div>
  );
}

export default ServiceEmbeddedRelationsForm;
