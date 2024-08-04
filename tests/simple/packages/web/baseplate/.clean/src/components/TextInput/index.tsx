import clsx from 'clsx';
import {
  MouseEventHandler,
  KeyboardEventHandler,
  FocusEventHandler,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
} from 'react';
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
}: Props): JSX.Element {
  const inputProps: InputHTMLAttributes<HTMLInputElement> = {
    name,
    placeholder,
    disabled,
    type,
    onChange: onChange && ((e) => onChange(e.target.value)),
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
}: TextInputLabelledProps): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
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
}: TextInputControllerProps<TFieldValues, TFieldName>): JSX.Element {
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
