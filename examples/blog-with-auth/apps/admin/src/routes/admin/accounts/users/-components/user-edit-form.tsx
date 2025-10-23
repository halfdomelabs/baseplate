import type { ReactElement } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@src/components/ui/button';
import { Card, CardContent, CardFooter } from '@src/components/ui/card';
import { InputFieldController } from '@src/components/ui/input-field';
import { logAndFormatError } from '@src/services/error-formatter';

import type { UserFormData } from '../-schemas/user-schema';

import { userEditFormSchema } from '../-schemas/user-schema';

/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_LIST_ROUTE=/admin/accounts/users */

interface Props {
  className?: string;
  initialData?: UserFormData;
  submitData: (data: UserFormData) => Promise<void>;
  /* TPL_EXTRA_PROPS:BLOCK */
}

export function /* TPL_COMPONENT_NAME:START */ UserEditForm /* TPL_COMPONENT_NAME:END */(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    className,
    initialData,
    submitData,
  } /* TPL_DESTRUCTURED_PROPS:END */ : Props,
): ReactElement {
  const { handleSubmit, control } = useForm({
    resolver: zodResolver(
      /* TPL_EDIT_SCHEMA:START */ userEditFormSchema /* TPL_EDIT_SCHEMA:END */,
    ),
    defaultValues: initialData,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (data: UserFormData): Promise<void> => {
    try {
      setIsUpdating(true);
      await submitData(data);
    } catch (err) {
      toast.error(logAndFormatError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  /* TPL_HEADER:BLOCK */

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <Card>
          <CardContent className="flex flex-col gap-4">
            {/* TPL_INPUTS:START */}
            <InputFieldController label="Name" control={control} name="name" />
            <InputFieldController
              label="Email"
              control={control}
              name="email"
            />
            {/* TPL_INPUTS:END */}
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
