// @ts-nocheck

import type { ReactElement } from 'react';

import { Button, Card, CardContent, CardFooter } from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
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
        <Card>
          <CardContent className="flex flex-col gap-4">
            <TPL_INPUTS />
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={isUpdating}>
              Save
            </Button>
            <Link to="/admin/accounts/users">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
