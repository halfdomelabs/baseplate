import type { Control } from 'react-hook-form';

import { authConfigSpec } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  cn,
  ComboboxFieldController,
  InputFieldController,
  MultiComboboxFieldController,
} from '@halfdomelabs/ui-components';
import { notEmpty } from '@halfdomelabs/utils';
import { useFieldArray, useWatch } from 'react-hook-form';

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition';

interface Props {
  className?: string;
  control: Control<StoragePluginDefinitionInput>;
}

function CategoryEditorForm({ className, control }: Props): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  const { definition, pluginContainer } = useProjectDefinition();

  const fileModelRef = useWatch({ control, name: 'modelRefs.file' });
  const adapters = useWatch({ control, name: 's3Adapters' });

  const adapterOptions = adapters.map((adapter) => ({
    label: adapter.name,
    value: adapter.id,
  }));

  const foreignKeyOptions = definition.models
    .flatMap((m) =>
      m.model.relations
        ?.filter((r) => r.modelRef === fileModelRef)
        .map((r) => ({
          label: r.foreignRelationName,
          value: r.foreignId,
        })),
    )
    .filter(notEmpty);

  const roleOptions = pluginContainer
    .getPluginSpec(authConfigSpec)
    .getAuthRoles(definition)
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));

  return (
    <div className={cn('storage:space-y-4', className)}>
      <h3>Upload Categories</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className="storage:space-y-4">
          <div className="storage:grid storage:grid-cols-3 storage:gap-4">
            <InputFieldController
              label="Name"
              control={control}
              name={`categories.${idx}.name`}
            />
            <ComboboxFieldController
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
            <ComboboxFieldController
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
