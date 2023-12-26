import { ModelConfig, randomUid } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { Control, useFieldArray } from 'react-hook-form';

import ModelUniqueConstraintForm from './ModelUniqueConstraintForm';
import { LinkButton } from 'src/components';

interface Props {
  className?: string;
  control: Control<ModelConfig>;
}

function ModelUniqueConstraintsField({
  className,
  control,
}: Props): JSX.Element {
  const { fields, remove, append } = useFieldArray({
    control,
    name: 'model.uniqueConstraints',
  });

  return (
    <div className={classNames('w-1/2 min-w-[400px] space-y-4', className)}>
      <h2>Unique Constraints</h2>
      {fields.map((field, i) => (
        <div key={field.id}>
          <div className="flex flex-row space-x-4">
            <ModelUniqueConstraintForm
              control={control}
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
            uid: randomUid(),
            name: '',
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
