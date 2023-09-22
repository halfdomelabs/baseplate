import { clsx } from 'clsx';
import { ForwardedRef, useId } from 'react';
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

interface CheckedInputLabelWrapperProps extends LabellableComponent {
  className?: string;
  horizontalLabel?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

function CheckedInputLabelWrapper({
  className,
  error,
  label,
  horizontalLabel,
  children,
  description,
  htmlFor,
}: CheckedInputLabelWrapperProps): JSX.Element {
  return (
    <div className={clsx('flex flex-col space-y-2', className)}>
      {horizontalLabel ? (
        <div className="flex items-center space-x-2">
          {children}
          {label && <FormLabel htmlFor={htmlFor}>{label}</FormLabel>}
        </div>
      ) : (
        <>
          {label && <FormLabel htmlFor={htmlFor}>{label}</FormLabel>}
          {children}
        </>
      )}
      {error ? (
        <FormError>{error}</FormError>
      ) : (
        description && <FormDescription>{description}</FormDescription>
      )}
    </div>
  );
}

export interface CheckedInputProps extends LabellableComponent {
  className?: string;
  name?: string;
  disabled?: boolean;
  onChange?(checked: boolean, value?: string): void;
  checked?: boolean;
  value?: string;
  type?: 'checkbox' | 'radio';
  register?: UseFormRegisterReturn;
  horizontalLabel?: boolean;
}

function CheckedInputFn(
  {
    className,
    name,
    disabled,
    onChange,
    checked,
    value,
    register,
    type = 'checkbox',
    label,
    error,
    description,
    horizontalLabel,
  }: CheckedInputProps,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element {
  const onChangeHandler =
    onChange &&
    ((event: React.ChangeEvent<HTMLInputElement>): void => {
      onChange(event.target.checked, event.target.value);
    });

  const id = useId();

  const inputProps = {
    name,
    disabled,
    onChange: onChangeHandler,
    checked,
    value,
    type,
    id,
    ...register,
  };

  return (
    <CheckedInputLabelWrapper
      className={className}
      error={error}
      label={label}
      description={description}
      horizontalLabel={horizontalLabel}
      htmlFor={id}
    >
      <input
        className={clsx(
          'h-4 w-4 cursor-pointer border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500',
          { rounded: type === 'checkbox' }
        )}
        ref={ref}
        {...inputProps}
      />
    </CheckedInputLabelWrapper>
  );
}

/**
 * A text input field.
 */
const CheckedInputRoot = genericForwardRef(CheckedInputFn);

export interface CheckedInputControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<CheckedInputProps, 'register'> {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

function CheckedInputControllerFn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  {
    control,
    name,
    ...rest
  }: CheckedInputControllerProps<TFieldValues, TFieldName>,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <CheckedInputRoot
      register={control.register(name)}
      error={error?.message}
      ref={ref}
      {...rest}
    />
  );
}

const CheckedInputController = genericForwardRef(CheckedInputControllerFn);

export const CheckedInput = Object.assign(CheckedInputRoot, {
  Controller: CheckedInputController,
});
