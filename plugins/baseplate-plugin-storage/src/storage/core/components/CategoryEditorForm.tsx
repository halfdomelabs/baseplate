import type { Control } from 'react-hook-form';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  cn,
  ComboboxField,
  InputFieldController,
  MultiComboboxFieldController,
} from '@halfdomelabs/ui-components';
import { notEmpty } from '@halfdomelabs/utils';
import { useFieldArray, useWatch } from 'react-hook-form';

import type { StoragePluginDefinition } from '../schema/plugin-definition';

interface Props {
  className?: string;
  control: Control<StoragePluginDefinition>;
}

function CategoryEditorForm({ className, control }: Props): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  const { definition } = useProjectDefinition();

  const fileModel = useWatch({ control, name: 'fileModelRef' });
  const adapters = useWatch({ control, name: 's3Adapters' });

  const adapterOptions = adapters.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
  }));

  const foreignKeyOptions = definition.models
    .flatMap((m) =>
      m.model.relations
        ?.filter((r) => r.modelRef === fileModel)
        .map((r) => ({
          label: r.foreignRelationName,
          value: r.foreignId,
        })),
    )
    .filter(notEmpty);

  const roleOptions =
    definition.auth?.roles.map((role) => ({
      label: role.name,
      value: role.id,
    })) ?? [];

  return (
    <div className={cn('space-y-4', className)}>
      <h3>Upload Categories</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className={cn('space-y-4')}>
          <div className={cn('grid grid-cols-3 gap-4')}>
            <InputFieldController
              label="Name"
              control={control}
              name={`categories.${idx}.name`}
            />
            <ComboboxField.Controller
              label="Default Adapter"
              control={control}
              name={`categories.${idx}.defaultAdapterRef`}
              options={adapterOptions}
            />
            <InputFieldController
              label="Max File Size (MB)"
              control={control}
              name={`categories.${idx}.maxFileSize`}
            />
            <ComboboxField.Controller
              label="Used By Relation"
              control={control}
              name={`categories.${idx}.usedByRelationRef`}
              options={foreignKeyOptions}
            />
            <MultiComboboxFieldController
              label="Upload Roles"
              control={control}
              options={roleOptions}
              name={`categories.${idx}.uploadRoles`}
              className={cn('col-span-2')}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              remove(idx);
            }}
          >
            Remove
          </Button>
        </div>
      ))}

      <Button
        onClick={() => {
          append({
            name: '',
            defaultAdapterRef: '',
            usedByRelationRef: '',
            uploadRoles: [],
          });
        }}
      >
        Add Category
      </Button>
    </div>
  );
}

export default CategoryEditorForm;
