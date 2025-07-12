import type React from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InputFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition.js';

const adapterSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  bucketConfigVar: z.string().min(1, 'Bucket config variable is required'),
  hostedUrlConfigVar: z.string().optional(),
});

type AdapterFormData = z.infer<typeof adapterSchema>;

interface AdapterDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  adapter?: StoragePluginDefinitionInput['s3Adapters'][0];
  isNew?: boolean;
  onSave: (adapter: StoragePluginDefinitionInput['s3Adapters'][0]) => void;
  asChild?: boolean;
  children?: React.ReactNode;
}

export function AdapterDialog({
  open,
  onOpenChange,
  adapter,
  isNew = false,
  onSave,
  asChild,
  children,
}: AdapterDialogProps): React.JSX.Element {
  const form = useForm<AdapterFormData>({
    resolver: zodResolver(adapterSchema),
    values: adapter,
  });

  const { control, handleSubmit } = form;

  const onSubmit = handleSubmit((data) => {
    onSave(data as StoragePluginDefinitionInput['s3Adapters'][0]);
    onOpenChange?.(false);
  });

  const formId = useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild={asChild}>{children}</DialogTrigger>
      <DialogContent>
        <form
          id={formId}
          onSubmit={(e) => {
            e.stopPropagation();
            return onSubmit(e);
          }}
        >
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Adapter' : 'Edit Adapter'}</DialogTitle>
            <DialogDescription>
              {isNew
                ? 'Enter the details for the new S3 adapter.'
                : 'Update the adapter details below.'}
            </DialogDescription>
          </DialogHeader>
          <div className="storage:space-y-4 storage:py-4">
            <InputFieldController
              label="Adapter Name"
              name="name"
              control={control}
              placeholder="Enter adapter name"
            />
            <InputFieldController
              label="AWS Bucket Name Environment Variable"
              name="bucketConfigVar"
              control={control}
              placeholder="e.g. UPLOADS_BUCKET"
              description="The environment variable that contains the name of the S3 bucket to use for this adapter."
            />
            <InputFieldController
              label="Bucket URL Prefix Environment Variable"
              name="hostedUrlConfigVar"
              control={control}
              placeholder="e.g. UPLOADS_URL_PREFIX"
              description="The environment variable that contains the domain of the S3 bucket. Optional if bucket is not publicly accessible."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange?.(false);
              }}
            >
              Cancel
            </Button>
            <Button form={formId} type="submit">
              {isNew ? 'Add' : 'Update'} Adapter
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
