import {
  storageAdapterEntityType,
  StorageConfig,
} from '@halfdomelabs/project-builder-lib';
import clsx from 'clsx';
import { Control, useFieldArray } from 'react-hook-form';

import { Button, TextInput } from 'src/components';

interface Props {
  className?: string;
  control: Control<StorageConfig>;
}

function AdapterEditorForm({ className, control }: Props): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 's3Adapters',
  });

  return (
    <div className={clsx('space-y-4', className)}>
      <h3>S3 Adapters</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className="space-y-4">
          <TextInput.LabelledController
            label="Name"
            control={control}
            name={`s3Adapters.${idx}.name`}
          />
          <TextInput.LabelledController
            label="Bucket Config Variable Name, e.g. UPLOADS_BUCKET_NAME"
            control={control}
            name={`s3Adapters.${idx}.bucketConfigVar`}
          />
          <TextInput.LabelledController
            label="Hosted URL prefix Config Variable Name, e.g. UPLOADS_URL_PREFIX"
            control={control}
            name={`s3Adapters.${idx}.hostedUrlConfigVar`}
          />
          <Button color="light" onClick={() => remove(idx)}>
            Remove
          </Button>
        </div>
      ))}

      <Button
        onClick={() =>
          append({
            id: storageAdapterEntityType.generateNewId(),
            name: '',
            bucketConfigVar: '',
          })
        }
      >
        Add Adapter
      </Button>
    </div>
  );
}

export default AdapterEditorForm;
