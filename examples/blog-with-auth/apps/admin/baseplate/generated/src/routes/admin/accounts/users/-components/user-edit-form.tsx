import type { ReactElement } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

import type { FragmentOf } from '@src/graphql';

import { Button } from '@src/components/ui/button';
import { Card, CardContent, CardFooter } from '@src/components/ui/card';
import { InputFieldController } from '@src/components/ui/input-field';
import { graphql, readFragment } from '@src/graphql';

import type { UserFormData } from '../-schemas/user-schema';

import { userEditFormSchema } from '../-schemas/user-schema';

/* TPL_COMPONENT_NAME=UserEditForm */
/* TPL_FORM_DATA_NAME=UserFormData */
/* TPL_LIST_ROUTE=/admin/accounts/users */

/* TPL_EDIT_FRAGMENT:START */
export const userEditFormDefaultValuesFragment = graphql(`
  fragment UserEditForm_defaultValues on User {
    email
    id
    name
  }
`);
/* TPL_EDIT_FRAGMENT:END */

interface Props {
  className?: string;
  submitData: (data: UserFormData) => Promise<void>;
  /* TPL_PROPS:START */
  defaultValues:
    | FragmentOf<typeof userEditFormDefaultValuesFragment>
    | undefined;
  /* TPL_PROPS:END */
}

export function UserEditForm(
  /* TPL_DESTRUCTURED_PROPS:START */ {
    className,
    submitData,
    defaultValues,
  } /* TPL_DESTRUCTURED_PROPS:END */ : Props,
): ReactElement {
  const initialValuesData = readFragment(
    userEditFormDefaultValuesFragment,
    defaultValues,
  );
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    resolver: zodResolver(
      /* TPL_EDIT_SCHEMA:START */ userEditFormSchema /* TPL_EDIT_SCHEMA:END */,
    ),
    defaultValues: initialValuesData,
  });

  /* TPL_HEADER:BLOCK */

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit((data) => submitData(data))}
        className="max-w-md space-y-4"
      >
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
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
            <Link to="/admin/accounts/users">
              <Button type="button" variant="secondary" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
