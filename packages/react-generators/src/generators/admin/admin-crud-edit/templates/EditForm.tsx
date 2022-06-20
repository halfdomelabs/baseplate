// @ts-nocheck

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Button } from '%react-components';
import { useStatus } from '%react-components/useStatus';
import { formatError } from '%react-error/formatter';

interface Props {
  className?: string;
  initialData?: Partial<FORM_DATA_NAME>;
  submitData: (data: FORM_DATA_NAME) => Promise<void>;
  EXTRA_PROPS;
}

function COMPONENT_NAME({
  className,
  initialData,
  submitData,
  EXTRA_PROP_SPREAD,
}: Props): JSX.Element {
  const { handleSubmit, control } = useForm<FORM_DATA_NAME>({
    resolver: zodResolver(EDIT_SCHEMA),
    defaultValues: initialData,
  });
  const { status, setError } = useStatus();
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (data: FORM_DATA_NAME): Promise<void> => {
    try {
      setIsUpdating(true);
      await submitData(data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  HEADER;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Alert.WithStatus status={status} />
        <INPUTS />
        <Button type="submit" disabled={isUpdating}>
          Save
        </Button>
      </form>
    </div>
  );
}

export default COMPONENT_NAME;
