// @ts-nocheck

import { zodResolver } from '@hookform/resolvers/zod';
import classNames from 'classnames';
import { useForm } from 'react-hook-form';
import { Alert, Button } from '%react-components';
import { useStatus } from '%react-components/useStatus';
import { formatError } from '%react-error/formatter';

interface Props {
  className?: string;
  initialData?: Partial<EMBEDDED_FORM_DATA_TYPE>;
  onSubmit: (data: EMBEDDED_FORM_DATA_TYPE) => void;
  EXTRA_PROPS;
}

function COMPONENT_NAME({
  className,
  initialData,
  onSubmit,
  EXTRA_PROP_SPREAD,
}: Props): JSX.Element {
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
        handleSubmit(onSubmit)(e).catch((err) => setError(formatError(err)));
      }}
      className={classNames('space-y-4', className)}
    >
      <Alert.WithStatus status={status} />
      <INPUTS />
      <Button type="submit">Save</Button>
    </form>
  );
}

export default COMPONENT_NAME;
