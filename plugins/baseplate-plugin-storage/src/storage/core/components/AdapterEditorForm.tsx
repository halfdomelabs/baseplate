import type { Control } from 'react-hook-form';

import { Button, InputFieldController } from '@halfdomelabs/ui-components';
import { useFieldArray } from 'react-hook-form';

import { cn } from '@src/utils/cn';

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition';

import { storageAdapterEntityType } from '../schema/plugin-definition';

interface Props {
  className?: string;
  control: Control<StoragePluginDefinitionInput>;
}

function AdapterEditorForm({ className, control }: Props): React.JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 's3Adapters',
  });

  return (
    <div className={cn('space-y-4', className)}>
      <h3>S3 Adapters</h3>
      {fields.map((field, idx) => (
        <div key={field.id} className={cn('space-y-4')}>
          <InputFieldController
            label="Name"
            control={control}
            name={`s3Adapters.${idx}.name`}
          />
          <div className={cn('flex w-full gap-4 *:flex-1')}>
            <InputFieldController
              label="AWS Bucket Name Environment Variable"
              control={control}
              name={`s3Adapters.${idx}.bucketConfigVar`}
              placeholder="e.g. UPLOADS_BUCKET"
              description="The environment variable that contains the name of the S3 bucket to use for this adapter."
            />
            <InputFieldController
              label="Bucket URL Prefix environment variable"
              control={control}
              name={`s3Adapters.${idx}.hostedUrlConfigVar`}
              placeholder="e.g. UPLOADS_URL_PREFIX"
              description="The environment variable that contains the domain of the S3 bucket. Optional if bucket is not publicly accessible."
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
            id: storageAdapterEntityType.generateNewId(),
            name: '',
            bucketConfigVar: '',
          });
        }}
      >
        Add Adapter
      </Button>
    </div>
  );
}

export default AdapterEditorForm;
