import type { HTMLInputTypeAttribute, InputHTMLAttributes } from 'react';
import type React from 'react';
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  UseFormRegisterReturn,
} from 'react-hook-form';

import clsx from 'clsx';
import { get, useFormState } from 'react-hook-form';

import FormError from '../FormError';
import FormLabel from '../FormLabel';

interface Props {
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  type?: HTMLInputTypeAttribute;
  register?: UseFormRegisterReturn;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
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
  value,
  onFocus,
  register,
}: Props): React.JSX.Element {
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
    onFocus,
    value,
    ...register,
  };
  return (
    <input
      className={clsx(
        'block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500',
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
}: TextInputLabelledProps): React.JSX.Element {
  return (
    <label className={clsx('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <TextInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </label>
  );
};

interface TextInputControllerProps<T extends FieldValues>
  extends TextInputLabelledProps {
  control: Control<T>;
  name: FieldPath<T>;
}

TextInput.LabelledController = function TextInputController<
  T extends FieldValues,
>({ control, name, ...rest }: TextInputControllerProps<T>): React.JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <TextInput.Labelled
      register={control.register(name)}
      error={error?.message}
      {...rest}
    />
  );
};

export default TextInput;
