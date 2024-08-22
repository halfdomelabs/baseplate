import { FormItem, genericForwardRef } from '@halfdomelabs/ui-components';
import React, { ForwardedRef } from 'react';
import {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  get,
  RegisterOptions,
  UseFormRegisterReturn,
  useFormState,
} from 'react-hook-form';

export interface EditableTitleProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'onChange' | 'value'
  > {
  error?: React.ReactNode;
  onChange?: (value: string) => void;
  value?: string;
  register?: UseFormRegisterReturn;
}

const EditableTitleRoot = React.forwardRef<HTMLDivElement, EditableTitleProps>(
  ({ error, onChange, register, ...props }, ref) => {
    return (
      <FormItem ref={ref} error={error}>
        <FormItem.Control>
          <input
            {...props}
            {...register}
            className="-mx-3 -my-1 w-auto rounded-md border border-transparent px-3 py-1 transition hover:border-border"
          />
        </FormItem.Control>
        {error && <FormItem.Error>{error}</FormItem.Error>}
      </FormItem>
    );
  },
);
EditableTitleRoot.displayName = 'EditableTitle';

export interface EditableTitleControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends EditableTitleProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}
const EditableTitleController = genericForwardRef(
  <
    TFieldValues extends FieldValues = FieldValues,
    TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    {
      control,
      name,
      registerOptions,
      ...rest
    }: EditableTitleControllerProps<TFieldValues, TFieldName>,
    ref: ForwardedRef<HTMLDivElement>,
  ): JSX.Element => {
    const { errors } = useFormState({ control, name });
    const error = get(errors, name) as FieldError | undefined;

    return (
      <EditableTitleRoot
        register={control.register(name, registerOptions)}
        error={error?.message}
        ref={ref}
        {...rest}
      />
    );
  },
  'EditableTitleController',
);

export const EditableTitle = Object.assign(EditableTitleRoot, {
  Controller: EditableTitleController,
});
