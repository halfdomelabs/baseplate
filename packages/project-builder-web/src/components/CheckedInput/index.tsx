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
  name?: string;
  disabled?: boolean;
  onChange?: (checked: boolean, value?: string) => void;
  checked?: boolean;
  value?: string;
  type?: 'checkbox' | 'radio';
  register?: UseFormRegisterReturn;
}

function CheckedInput({
  className,
  name,
  disabled,
  onChange,
  checked,
  value,
  register,
  type = 'checkbox',
}: Props): React.JSX.Element {
  const onChangeHandler =
    onChange &&
    ((event: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(event.target.checked, event.target.value);
    });

  const inputProps = {
    name,
    disabled,
    onChange: onChangeHandler,
    checked,
    value,
    type,
    ...register,
  };
  return (
    <input
      className={clsx(
        'size-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600',
        className,
      )}
      {...inputProps}
    />
  );
}

interface CheckedInputLabelledProps extends Props {
  label?: string;
  error?: React.ReactNode;
}

CheckedInput.Labelled = function SelectInputLabelled({
  label,
  className,
  error,
  ...rest
}: CheckedInputLabelledProps): React.JSX.Element {
  return (
    <label className={clsx('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <CheckedInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </label>
  );
};

interface CheckedInputLabelledControllerProps<T extends FieldValues>
  extends Omit<CheckedInputLabelledProps, 'register'> {
  control: Control<T>;
  name: FieldPath<T>;
}

CheckedInput.LabelledController = function CheckedInputLabelledController<
  T extends FieldValues,
>({
  control,
  name,
  ...rest
}: CheckedInputLabelledControllerProps<T>): React.JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <CheckedInput.Labelled
      register={control.register(name)}
      error={error?.message}
      {...rest}
    />
  );
};

export default CheckedInput;
