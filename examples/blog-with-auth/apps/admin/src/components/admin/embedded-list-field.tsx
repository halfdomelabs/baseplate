import type { ReactElement } from 'react';
import type {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import { useController } from 'react-hook-form';

import type { EmbeddedListInputProps } from './embedded-list-input';

import {
  Field,
  FieldError,
  FieldLabel,
} from '../ui/field';
import { EmbeddedListInput } from './embedded-list-input';

export interface EmbeddedListFieldProps<
  InputType,
> extends EmbeddedListInputProps<InputType> {
  label?: React.ReactNode;
  error?: string;
}

export function EmbeddedListField<InputType>({
  label,
  error,
  ...rest
}: EmbeddedListFieldProps<InputType>): ReactElement {
  return (
    <Field data-invalid={!!error}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <EmbeddedListInput {...rest} />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

interface EmbeddedListFieldControllerProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<
  EmbeddedListFieldProps<
    Exclude<
      FieldPathValue<TFieldValues, TName>,
      undefined | null
    > extends (infer InputType)[]
      ? InputType
      : never
  >,
  'onChange' | 'value' | 'error'
> {
  control: Control<TFieldValues>;
  name: TName;
}

export function EmbeddedListFieldController<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  ...rest
}: EmbeddedListFieldControllerProps<TFieldValues, TName>): ReactElement {
  const {
    field,
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <EmbeddedListField
      {...rest}
      error={error?.message}
      onChange={(value) => {
        field.onChange(value as FieldPathValue<TFieldValues, TName>);
      }}
      value={
        field.value as (FieldPathValue<
          TFieldValues,
          TName
        > extends (infer InputType)[]
          ? InputType
          : never)[]
      }
    />
  );
}
