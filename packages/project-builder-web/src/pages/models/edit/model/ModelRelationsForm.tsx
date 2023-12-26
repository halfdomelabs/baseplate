import {
  ModelConfig,
  ModelRelationFieldConfig,
  randomUid,
} from '@halfdomelabs/project-builder-lib';
import { clsx } from 'clsx';
import { Control, useController } from 'react-hook-form';

import ModelRelationForm from './ModelRelationForm';
import { LinkButton } from '@src/components';

interface ModelRelationsFormProps {
  className?: string;
  control: Control<ModelConfig>;
  originalModel?: ModelConfig;
}

export function ModelRelationsForm({
  className,
  control,
  originalModel,
}: ModelRelationsFormProps): JSX.Element {
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
    <div className={clsx('space-y-4', className)}>
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
              control={control}
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
    </div>
  );
}
