import { clsx } from 'clsx';
import { ForwardedRef, forwardRef, useId } from 'react';
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
import { LabellableComponent } from '@src/types/form.js';
import { FormDescription } from '../FormDescription/FormDescription.js';
import { FormError } from '../FormError/FormError.js';

// adapted from https://flowbite.com/docs/forms/toggle/

interface ToggleInputLabelWrapperProps extends LabellableComponent {
  className?: string;
  horizontalLabel?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

function ToggleInputLabelWrapper({
  className,
  error,
  label,
  horizontalLabel,
  children,
  description,
  htmlFor,
}: ToggleInputLabelWrapperProps): JSX.Element {
  return (
    <div className={clsx('flex flex-col items-start space-y-2', className)}>
      {horizontalLabel ? (
        <label
          htmlFor={htmlFor}
          className="relative inline-flex cursor-pointer items-center"
        >
          {children}
          {label && <div className="label-text ml-2">{label}</div>}
        </label>
      ) : (
        <label
          className="relative inline-flex cursor-pointer flex-col items-start"
          htmlFor={htmlFor}
        >
          {label && <div className="label-text mb-2">{label}</div>}
          <div className="relative">{children}</div>
        </label>
      )}
      {error ? (
        <FormError>{error}</FormError>
      ) : (
        description && <FormDescription>{description}</FormDescription>
      )}
    </div>
  );
}

export interface ToggleInputProps extends LabellableComponent {
  className?: string;
  name?: string;
  disabled?: boolean;
  onChange?(checked: boolean, value?: string): void;
  checked?: boolean;
  value?: string;
  register?: UseFormRegisterReturn;
  horizontalLabel?: boolean;
}

function ToggleInputFn(
  {
    className,
    name,
    disabled,
    onChange,
    checked,
    value,
    register,
    label,
    error,
    description,
    horizontalLabel,
  }: ToggleInputProps,
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
    id,
    ...register,
  };

  return (
    <ToggleInputLabelWrapper
      className={className}
      error={error}
      label={label}
      description={description}
      horizontalLabel={horizontalLabel}
      htmlFor={id}
    >
      <input
        className="peer sr-only"
        type="checkbox"
        ref={ref}
        {...inputProps}
      />
      <div
        className={clsx(
          "peer h-6 w-11 rounded-full bg-background-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-background-300 after:bg-white after:transition-all after:content-['']",
          'peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300',
          'dark:border-background-600 dark:bg-background-700 dark:peer-focus:ring-primary-800'
        )}
      />
    </ToggleInputLabelWrapper>
  );
}

/**
 * A text input field.
 */
const ToggleInputRoot = forwardRef(ToggleInputFn);

export interface ToggleInputControllerProps<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends Omit<ToggleInputProps, 'register'> {
  control: Control<TFieldValues>;
  name: TFieldName;
  registerOptions?: RegisterOptions<TFieldValues, TFieldName>;
}

function ToggleInputControllerFn<
  TFieldValues extends FieldValues = FieldValues,
  TFieldName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  {
    control,
    name,
    ...rest
  }: ToggleInputControllerProps<TFieldValues, TFieldName>,
  ref: ForwardedRef<HTMLInputElement>
): JSX.Element {
  const { errors } = useFormState({ control, name });
  const error = get(errors, name) as FieldError | undefined;

  return (
    <ToggleInputRoot
      register={control.register(name)}
      error={error?.message}
      ref={ref}
      {...rest}
    />
  );
}

const ToggleInputController = forwardRef(ToggleInputControllerFn);

export const ToggleInput = Object.assign(ToggleInputRoot, {
  Controller: ToggleInputController,
});
