import { ModelConfig } from '@baseplate/project-builder-lib';
import classNames from 'classnames';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { LinkButton } from 'src/components';
import ModelUniqueConstraintForm from './ModelUniqueConstraintForm';

interface Props {
  className?: string;
  formProps: UseFormReturn<ModelConfig>;
}

function ModelUniqueConstraintsField({
  className,
  formProps,
}: Props): JSX.Element {
  const { control } = formProps;
  const { fields, remove, append } = useFieldArray({
    control,
    name: 'model.uniqueConstraints',
  });

  return (
    <div className={classNames('space-y-4 min-w-[400px] w-1/2', className)}>
      <h2>Unique Constraints</h2>
      {fields.map((field, i) => (
        <div key={field.id}>
          <div className="flex flex-row space-x-4">
            <ModelUniqueConstraintForm
              formProps={formProps}
              idx={i}
              field={field}
              onRemove={remove}
            />
          </div>
        </div>
      ))}
      <LinkButton
        onClick={() =>
          append({
            fields: [],
          })
        }
      >
        Add Unique Constraint
      </LinkButton>
    </div>
  );
}

export default ModelUniqueConstraintsField;
