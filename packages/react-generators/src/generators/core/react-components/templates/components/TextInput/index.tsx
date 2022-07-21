// @ts-nocheck
import classNames from 'classnames';
import { HTMLInputTypeAttribute, InputHTMLAttributes } from 'react';
import {
  Control,
  FieldError,
  FieldPath,
  get,
  UseFormRegisterReturn,
  useFormState,
  RegisterOptions,
  FieldValues,
} from 'react-hook-form';
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
  register,
}: Props): JSX.Element {
  const inputProps: InputHTMLAttributes<HTMLInputElement> = {
    name,
    placeholder,
    disabled,
    type,
    onChange: onChange && ((e) => onChange(e.target.value)),
    onBlur,
    value,
    ...register,
  };
  return (
    <input
      className={classNames(
        'bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
        className
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
}: TextInputLabelledProps): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={classNames('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <TextInput {...rest} />
      {error && <FormError>{error}</FormError>}
    </label>
  );
};

interface TextInputControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends TextInputLabelledProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

TextInput.LabelledController = function TextInputController<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  ...rest
}: TextInputControllerProps<TFieldValues, TFieldName>): JSX.Element {
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
