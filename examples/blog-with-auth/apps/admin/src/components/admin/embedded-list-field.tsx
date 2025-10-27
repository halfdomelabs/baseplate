import type { ReactElement } from 'react';
import type {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import { useController } from 'react-hook-form';

import type { EmbeddedListInputProps } from './embedded-list-input';

import { FormControl, FormItem, FormLabel, FormMessage } from '../ui/form-item';
import { EmbeddedListInput } from './embedded-list-input';

export interface EmbeddedListFieldProps<InputType>
  extends EmbeddedListInputProps<InputType> {
  label?: React.ReactNode;
}

export function EmbeddedListField<InputType>({
  label,
  ...rest
}: EmbeddedListFieldProps<InputType>): ReactElement {
  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <EmbeddedListInput {...rest} />
      </FormControl>
      <FormMessage />
    </FormItem>
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
    <FormItem error={error?.message}>
      <EmbeddedListField
        {...rest}
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
    </FormItem>
  );
}
