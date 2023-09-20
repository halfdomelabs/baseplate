import { clsx } from 'clsx';
import {
  FocusEventHandler,
  ForwardedRef,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  KeyboardEventHandler,
  MouseEventHandler,
  useId,
} from 'react';
import {
  Control,
  FieldError,
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
  get,
  useFormState,
} from 'react-hook-form';
import { LabellableComponent } from '@src/types/form.js';
import { genericForwardRef } from '@src/utils/generic-forward-ref.js';
import { FormDescription } from '../FormDescription/FormDescription.js';
import { FormError } from '../FormError/FormError.js';
import { FormLabel } from '../FormLabel/FormLabel.js';

export interface TextInputProps extends LabellableComponent {
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
    label,
    error,
    description,
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

  const addWrapper = label || error || description;

  const id = useId();

  const inputComponent = (
    <input
      className={clsx('ux-input', 'p-2.5', addWrapper ? null : className)}
      id={id}
      ref={ref}
      {...inputProps}
    />
  );

  if (addWrapper) {
    return (
      <div className={clsx('space-y-2', className)}>
        {label && <FormLabel htmlFor={id}>{label}</FormLabel>}
        {inputComponent}
        {error ? (
          <FormError>{error}</FormError>
        ) : (
          description && <FormDescription>{description}</FormDescription>
        )}
      </div>
    );
  }
  return inputComponent;
}

/**
 * A text input field.
 */
const TextInputRoot = genericForwardRef(TextInputFn);

export interface TextInputControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends TextInputProps {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

function TextInputControllerFn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  {
    control,
    name,
    registerOptions,
    ...rest
  }: TextInputControllerProps<TFieldValues, TFieldName>,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <TextInputRoot
      register={control.register(name, registerOptions)}
      error={error?.message}
      ref={ref}
      {...rest}
    />
  );
}

export const TextInputController = genericForwardRef(TextInputControllerFn);

export const TextInput = Object.assign(TextInputRoot, {
  Controller: TextInputController,
});
