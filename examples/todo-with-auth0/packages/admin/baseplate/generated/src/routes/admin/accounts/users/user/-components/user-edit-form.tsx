import type { ReactElement } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { EmbeddedListFieldController } from '@src/components/admin/embedded-list-field';
import { EmbeddedObjectFieldController } from '@src/components/admin/embedded-object-field';
import { Button } from '@src/components/ui/button';
import { Card, CardContent, CardFooter } from '@src/components/ui/card';
import { InputFieldController } from '@src/components/ui/input-field';
import { logAndFormatError } from '@src/services/error-formatter';

import type { UserFormData } from '../-schemas/user-schema';

import { userEditFormSchema } from '../-schemas/user-schema';
import { EmbeddedCustomerForm } from './embedded-customer-form';
import { EmbeddedRolesForm, EmbeddedRolesTable } from './embedded-roles-form';

/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_LIST_ROUTE=/admin/accounts/users/user */

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
            <EmbeddedObjectFieldController
              label="Customer"
              control={control}
              name="customer"
              renderForm={(formProps) => (
                <EmbeddedCustomerForm {...formProps} />
              )}
            />
            <EmbeddedListFieldController
              label="Roles"
              control={control}
              name="roles"
              renderForm={(formProps) => <EmbeddedRolesForm {...formProps} />}
              renderTable={(tableProps) => (
                <EmbeddedRolesTable {...tableProps} />
              )}
            />
            <InputFieldController
              label="Password"
              control={control}
              name="password"
              type="password"
              registerOptions={{
                setValueAs: (val: string) => (val === '' ? undefined : val),
              }}
            />
            {/* TPL_INPUTS:END */}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={isUpdating}>
              Save
            </Button>
            <Link to="/admin/accounts/users/user">
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
