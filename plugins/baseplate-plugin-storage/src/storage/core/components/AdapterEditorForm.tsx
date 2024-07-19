import { Button, InputField } from '@halfdomelabs/ui-components';
import { Control, useFieldArray } from 'react-hook-form';

import {
  StoragePluginDefinition,
  storageAdapterEntityType,
} from '../schema/plugin-definition';
import { cn } from '@src/utils/cn';

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
    <div className={cn('space-y-4', className)}>
      <h3>S3 Adapters</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className={cn('space-y-4')}>
          <InputField.Controller
            label="Name"
            control={control}
            name={`s3Adapters.${idx}.name`}
          />
          <div className={cn('flex gap-4 [&>*]:flex-1 w-full')}>
            <InputField.Controller
              label="AWS Bucket Name Environment Variable"
              control={control}
              name={`s3Adapters.${idx}.bucketConfigVar`}
              placeholder="e.g. UPLOADS_BUCKET"
              description="The environment variable that contains the name of the S3 bucket to use for this adapter."
            />
            <InputField.Controller
              label="Bucket URL Prefix environment variable"
              control={control}
              name={`s3Adapters.${idx}.hostedUrlConfigVar`}
              placeholder="e.g. UPLOADS_URL_PREFIX"
              description="The environment variable that contains the domain of the S3 bucket. Optional if bucket is not publicly accessible."
            />
          </div>
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
