import type { ReactElement } from 'react';
import type {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import { useController } from 'react-hook-form';

import type { EmbeddedObjectInputProps } from './embedded-object-input';

import { Field, FieldError, FieldLabel } from '../ui/field';
import { EmbeddedObjectInput } from './embedded-object-input';

export interface EmbeddedObjectFieldProps<
  InputType,
> extends EmbeddedObjectInputProps<InputType> {
  label?: React.ReactNode;
  error?: string;
}

export function EmbeddedObjectField<InputType>({
  label,
  error,
  ...rest
}: EmbeddedObjectFieldProps<InputType>): ReactElement {
  return (
    <Field data-invalid={!!error}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <EmbeddedObjectInput {...rest} />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

interface EmbeddedObjectFieldControllerProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<
  EmbeddedObjectFieldProps<FieldPathValue<TFieldValues, TName>>,
  'onChange' | 'value' | 'error'
> {
  control: Control<TFieldValues>;
  name: TName;
}

export function EmbeddedObjectFieldController<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  ...rest
}: EmbeddedObjectFieldControllerProps<TFieldValues, TName>): ReactElement {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <EmbeddedObjectField
      {...rest}
      error={error?.message}
      onChange={(value) => {
        field.onChange(value as FieldPathValue<TFieldValues, TName>);
      }}
      value={field.value as FieldPathValue<TFieldValues, TName>}
    />
  );
}
