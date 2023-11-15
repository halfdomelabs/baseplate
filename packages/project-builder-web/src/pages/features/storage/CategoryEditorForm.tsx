import { randomUid, StorageConfig } from '@halfdomelabs/project-builder-lib';
import classNames from 'classnames';
import { Control, useFieldArray, useWatch } from 'react-hook-form';

import { Button, TextInput } from 'src/components';
import CheckedArrayInput from 'src/components/CheckedArrayInput';
import ReactSelectInput from 'src/components/ReactSelectInput';
import { useProjectConfig } from 'src/hooks/useProjectConfig';
import { notEmpty } from 'src/utils/array';

interface Props {
  className?: string;
  control: Control<StorageConfig>;
}

function CategoryEditorForm({ className, control }: Props): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'categories',
  });

  const { parsedProject } = useProjectConfig();

  const fileModel = useWatch({ control, name: 'fileModel' });
  const adapters = useWatch({ control, name: 's3Adapters' });

  const adapterOptions = (adapters ?? []).map((adapter) => ({
    label: adapter.name,
    value: adapter.name,
  }));

  const foreignKeyOptions = parsedProject
    .getModels()
    .flatMap(
      (m) =>
        m.model.relations
          ?.filter((r) => r.modelName === fileModel)
          .map((r) => ({
            label: r.foreignRelationName,
            value: r.foreignRelationName,
          }))
    )
    .filter(notEmpty);

  const roleOptions =
    parsedProject.projectConfig.auth?.roles.map((role) => ({
      label: role.name,
      value: role.name,
    })) ?? [];

  return (
    <div className={classNames('space-y-4', className)}>
      <h3>Upload Categories</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className="space-y-4">
          <TextInput.LabelledController
            label="Name"
            control={control}
            name={`categories.${idx}.name`}
          />
          <ReactSelectInput.LabelledController
            label="Default Adapter"
            control={control}
            name={`categories.${idx}.defaultAdapter`}
            options={adapterOptions}
          />
          <TextInput.LabelledController
            label="Max File Size (MB)"
            control={control}
            name={`categories.${idx}.maxFileSize`}
          />
          <ReactSelectInput.LabelledController
            label="Used By Relation"
            control={control}
            name={`categories.${idx}.usedByRelation`}
            options={foreignKeyOptions}
          />
          <CheckedArrayInput.LabelledController
            label="Upload Roles"
            control={control}
            options={roleOptions}
            name={`categories.${idx}.uploadRoles`}
          />
          <Button color="light" onClick={() => remove(idx)}>
            Remove
          </Button>
        </div>
      ))}

      <Button
        onClick={() =>
          append({
            uid: randomUid(),
            name: '',
            defaultAdapter: '',
            usedByRelation: '',
            uploadRoles: [],
          })
        }
      >
        Add Category
      </Button>
    </div>
  );
}

export default CategoryEditorForm;
