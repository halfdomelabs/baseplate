import { Button, InputField } from '@halfdomelabs/ui-components';
import clsx from 'clsx';
import { Control, useFieldArray } from 'react-hook-form';

import {
  StoragePluginDefinition,
  storageAdapterEntityType,
} from '../schema/plugin-definition';

interface Props {
  className?: string;
  control: Control<StoragePluginDefinition>;
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
          <InputField.Controller
            label="Name"
            control={control}
            name={`s3Adapters.${idx}.name`}
          />
          <InputField.Controller
            label="Bucket Config Variable Name, e.g. UPLOADS_BUCKET_NAME"
            control={control}
            name={`s3Adapters.${idx}.bucketConfigVar`}
          />
          <InputField.Controller
            label="Hosted URL prefix Config Variable Name, e.g. UPLOADS_URL_PREFIX"
            control={control}
            name={`s3Adapters.${idx}.hostedUrlConfigVar`}
          />
          <Button variant="secondary" onClick={() => remove(idx)}>
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
