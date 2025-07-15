// @ts-nocheck

import type { ReactElement } from 'react';
import type {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from '%reactComponentsImports';
import { useController } from 'react-hook-form';

import type { EmbeddedObjectInputProps } from '../embedded-object-input/embedded-object-input.js';

import { EmbeddedObjectInput } from '../embedded-object-input/embedded-object-input.js';

export interface EmbeddedObjectFieldProps<InputType>
  extends EmbeddedObjectInputProps<InputType> {
  label?: React.ReactNode;
}

export function EmbeddedObjectField<InputType>({
  label,
  ...rest
}: EmbeddedObjectFieldProps<InputType>): ReactElement {
  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <EmbeddedObjectInput {...rest} />
      </FormControl>
      <FormMessage />
    </FormItem>
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
    <FormItem error={error?.message}>
      <EmbeddedObjectField
        {...rest}
        onChange={(value) => {
          field.onChange(value as FieldPathValue<TFieldValues, TName>);
        }}
        value={field.value as FieldPathValue<TFieldValues, TName>}
      />
    </FormItem>
  );
}
