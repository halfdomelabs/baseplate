// @ts-nocheck

import type { ReactElement } from 'react';

import { Alert, Button, useStatus } from '%reactComponentsImports';
import { logAndFormatError } from '%reactErrorImports';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

TPL_TABLE_COMPONENT;

export function TPL_COMPONENT_NAME(
  TPL_DESTRUCTURED_PROPS: TPL_PROPS,
): ReactElement {
  const { handleSubmit, control } = useForm<TPL_EMBEDDED_FORM_DATA_TYPE>({
    resolver: zodResolver(TPL_EMBEDDED_FORM_DATA_SCHEMA),
    defaultValues: initialData,
  });
  const { status, setError } = useStatus();

  TPL_HEADER;

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit(onSubmit)(e).catch((err: unknown) => {
          setError(logAndFormatError(err));
        });
      }}
      className="space-y-4"
    >
      {status && <Alert>{status.message}</Alert>}
      <TPL_INPUTS />
      <Button type="submit">Update</Button>
    </form>
  );
}
