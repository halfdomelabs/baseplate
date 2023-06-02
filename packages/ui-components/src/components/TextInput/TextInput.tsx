import { clsx } from 'clsx';
import {
  MouseEventHandler,
  KeyboardEventHandler,
  FocusEventHandler,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  ForwardedRef,
  forwardRef,
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
import { FormError } from '../FormError/FormError.js';
import { FormLabel } from '../FormLabel/FormLabel.js';
import { FormSubtext } from '../FormSubtext/FormSubtext.js';

export interface TextInputProps {
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

function TextInputFn(
  {
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
  }: TextInputProps,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element {
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
        'block w-full rounded-lg border p-2.5 text-sm',
        'border-background-300 bg-white placeholder-foreground-500 focus:border-primary-500 focus:ring-primary-500',
        'dark:border-background-600 dark:bg-background-900 dark:placeholder-foreground-500 dark:focus:border-primary-700 dark:focus:ring-primary-700',
        className
      )}
      ref={ref}
      {...inputProps}
    />
  );
}

/**
 * A text input field.
 */
const TextInputRoot = forwardRef(TextInputFn);

export interface TextInputLabelledProps extends TextInputProps {
  label?: React.ReactNode;
  error?: React.ReactNode;
  subtext?: React.ReactNode;
}

function TextInputLabelledFn(
  { label, className, error, subtext, ...rest }: TextInputLabelledProps,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control
    <label className={clsx('block', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <TextInputRoot ref={ref} {...rest} />
      {error ? (
        <FormError>{error}</FormError>
      ) : (
        subtext && <FormSubtext>{subtext}</FormSubtext>
      )}
    </label>
  );
}

export const TextInputLabelled = forwardRef(TextInputLabelledFn);

export interface TextInputLabelledControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends TextInputLabelledProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

function TextInputLabelledControllerFn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  {
    control,
    name,
    registerOptions,
    ...rest
  }: TextInputLabelledControllerProps<TFieldValues, TFieldName>,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <TextInputLabelled
      register={control.register(name, registerOptions)}
      error={error?.message}
      ref={ref}
      {...rest}
    />
  );
}

export const TextInputLabelledController = forwardRef(
  TextInputLabelledControllerFn
);

export const TextInput = Object.assign(TextInputRoot, {
  Labelled: TextInputLabelled,
  LabelledController: TextInputLabelledController,
});
