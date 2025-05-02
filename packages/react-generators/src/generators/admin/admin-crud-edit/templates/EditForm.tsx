// @ts-nocheck

import { Alert, Button, useStatus } from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface Props {
  className?: string;
  initialData?: Partial<TPL_FORM_DATA_NAME>;
  submitData: (data: TPL_FORM_DATA_NAME) => Promise<void>;
  TPL_EXTRA_PROPS;
}

function TPL_COMPONENT_NAME(TPL_DESTRUCTURED_PROPS: Props): JSX.Element {
  const { handleSubmit, control } = useForm<TPL_FORM_DATA_NAME>({
    resolver: zodResolver(TPL_EDIT_SCHEMA),
    defaultValues: initialData,
  });
  const { status, setError } = useStatus();
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (data: TPL_FORM_DATA_NAME): Promise<void> => {
    try {
      setIsUpdating(true);
      await submitData(data);
    } catch (err) {
      setError(logAndFormatError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  TPL_HEADER;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Alert.WithStatus status={status} />
        <TPL_INPUTS />
        <Button type="submit" disabled={isUpdating}>
          Save
        </Button>
      </form>
    </div>
  );
}

export default TPL_COMPONENT_NAME;
