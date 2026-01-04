// @ts-nocheck

import type { ReactElement } from 'react';

import { readFragment } from '%graphqlImports';
import { Button, Card, CardContent, CardFooter } from '%reactComponentsImports';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';

TPL_EDIT_FRAGMENT;

interface Props {
  className?: string;
  submitData: (data: TPL_FORM_DATA_NAME) => Promise<void>;
  TPL_PROPS;
}

export function TPL_COMPONENT_NAME(
  TPL_DESTRUCTURED_PROPS: Props,
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
    resolver: zodResolver(TPL_EDIT_SCHEMA),
    defaultValues: initialValuesData,
  });

  TPL_HEADER;

  return (
    <div className={className}>
      <form
        onSubmit={handleSubmit((data) => submitData(data))}
        className="max-w-md space-y-4"
      >
        <Card>
          <CardContent className="flex flex-col gap-4">
            <TPL_INPUTS />
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
            <Link to="TPL_LIST_ROUTE">
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
