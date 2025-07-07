// @ts-nocheck

import type { ReactElement } from 'react';

import { Button } from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface Props {
  className?: string;
  initialData?: TPL_FORM_DATA_NAME;
  submitData: (data: TPL_FORM_DATA_NAME) => Promise<void>;
  TPL_EXTRA_PROPS;
}

export function TPL_COMPONENT_NAME(
  TPL_DESTRUCTURED_PROPS: Props,
): ReactElement {
  const { handleSubmit, control } = useForm({
    resolver: zodResolver(TPL_EDIT_SCHEMA),
    defaultValues: initialData,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (data: TPL_FORM_DATA_NAME): Promise<void> => {
    try {
      setIsUpdating(true);
      await submitData(data);
    } catch (err) {
      toast.error(logAndFormatError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  TPL_HEADER;

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <TPL_INPUTS />
        <Button type="submit" disabled={isUpdating}>
          Save
        </Button>
      </form>
    </div>
  );
}
