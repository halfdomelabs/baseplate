// @ts-nocheck

import type { TextareaHTMLAttributes } from 'react';
import type {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
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
  register?: UseFormRegisterReturn;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  value?: string;
  rows?: number;
}

const TextAreaInput = function TextInput({
  className,
  disabled,
  placeholder,
  name,
  onChange,
  onBlur,
  value,
  register,
  rows,
}: Props): JSX.Element {
  const inputProps: TextareaHTMLAttributes<HTMLTextAreaElement> = {
    name,
    placeholder,
    disabled,
    onChange:
      onChange &&
      ((e) => {
        onChange(e.target.value);
      }),
    onBlur,
    value,
    rows,
    ...register,
  };
  return (
    <textarea
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

TextAreaInput.Labelled = function TextInputLabelled({
  label,
  className,
  error,
  ...rest
}: TextInputLabelledProps): JSX.Element {
  return (
    <label className={clsx('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <TextAreaInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </label>
  );
};

interface TextInputControllerProps<T extends FieldValues>
  extends TextInputLabelledProps {
  control: Control<T>;
  name: FieldPath<T>;
}

TextAreaInput.LabelledController = function TextInputController<
  T extends FieldValues,
>({ control, name, ...rest }: TextInputControllerProps<T>): JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <TextAreaInput.Labelled
      register={control.register(name)}
      error={error?.message}
      {...rest}
    />
  );
};

export default TextAreaInput;
