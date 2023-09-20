// @ts-nocheck

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert, Button } from '%react-components';
import { useStatus } from '%react-components/useStatus';
import { logAndFormatError } from '%react-error/formatter';

TABLE_COMPONENT;

export function COMPONENT_NAME({
  initialData,
  onSubmit,
  EXTRA_PROP_SPREAD,
}: PROPS): JSX.Element {
  const { handleSubmit, control } = useForm<EMBEDDED_FORM_DATA_TYPE>({
    resolver: zodResolver(EMBEDDED_FORM_DATA_SCHEMA),
    defaultValues: initialData,
  });
  const { status, setError } = useStatus();

  HEADER;

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        handleSubmit(onSubmit)(e).catch((err) =>
          setError(logAndFormatError(err)),
        );
      }}
      className="space-y-4"
    >
      <Alert.WithStatus status={status} />
      <INPUTS />
      <Button type="submit">Update</Button>
    </form>
  );
}
