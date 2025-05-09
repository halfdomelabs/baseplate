// @ts-nocheck

import type {
  FocusEventHandler,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactElement,
} from 'react';
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
} from 'react-hook-form';

import clsx from 'clsx';
import { get, useFormState } from 'react-hook-form';

import FormError from '../FormError/index.js';
import FormLabel from '../FormLabel/index.js';

interface Props {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  type?: HTMLInputTypeAttribute;
  register?: UseFormRegisterReturn;
  onChange?: (value: string) => void;
  onClick?: MouseEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  value?: string;
}

const TextInput = function TextInput({
  className,
  disabled,
  placeholder,
  name,
  type = 'text',
  onChange,
  onBlur,
  onClick,
  onFocus,
  onKeyDown,
  value,
  register,
}: Props): ReactElement {
  const inputProps: InputHTMLAttributes<HTMLInputElement> = {
    name,
    placeholder,
    disabled,
    type,
    onChange:
      onChange &&
      ((e) => {
        onChange(e.target.value);
      }),
    onBlur,
    onClick,
    onFocus,
    onKeyDown,
    value,
    ...register,
  };
  return (
    <input
      className={clsx(
        'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500',
        className,
      )}
      {...inputProps}
    />
  );
};

interface TextInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
}

TextInput.Labelled = function TextInputLabelled({
  label,
  className,
  error,
  ...rest
}: TextInputLabelledProps): ReactElement {
  return (
    <label className={clsx('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <TextInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </label>
  );
};

interface TextInputControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends TextInputLabelledProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

TextInput.LabelledController = function TextInputController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  registerOptions,
  ...rest
}: TextInputControllerProps<TFieldValues, TFieldName>): ReactElement {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <TextInput.Labelled
      register={control.register(name, registerOptions)}
      error={error?.message}
      {...rest}
    />
  );
};

export default TextInput;
