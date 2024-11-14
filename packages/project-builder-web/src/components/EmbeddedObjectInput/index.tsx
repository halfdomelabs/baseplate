import type React from 'react';
import type {
  Control,
  DefaultValues,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import clsx from 'clsx';
import { useState } from 'react';
import { useController } from 'react-hook-form';

import Button from '../Button';
import FormError from '../FormError';
import FormLabel from '../FormLabel';
import Modal from '../Modal';

interface EmbeddedFormProps<InputType> {
  initialData?: DefaultValues<Exclude<InputType, undefined | null>>;
  onSubmit: (data: InputType) => void;
}

interface Props<InputType> {
  className?: string;
  onChange: (value: InputType | null | undefined) => void;
  renderForm: (options: EmbeddedFormProps<InputType>) => React.JSX.Element;
  value: InputType | null | undefined;
  itemName?: string;
  defaultValue?: DefaultValues<InputType>;
}

function EmbeddedObjectInput<InputType>({
  className,
  onChange,
  renderForm,
  value,
  itemName,
  defaultValue = {} as DefaultValues<InputType>,
}: Props<InputType>): React.JSX.Element {
  const [valueToEdit, setValueToEdit] = useState<
    DefaultValues<Exclude<InputType, undefined | null>> | undefined
  >();

  const handleSubmit = (data: InputType): void => {
    onChange(data);
    setValueToEdit(undefined);
  };

  return (
    <div className={clsx('flex flex-row space-x-4', className)}>
      <Button
        size="small"
        onClick={() => {
          setValueToEdit(
            (value ?? defaultValue) as DefaultValues<
              Exclude<InputType, undefined | null>
            >,
          );
        }}
      >
        {value ? 'Edit' : 'Create'}
      </Button>
      {value && (
        <Button
          size="small"
          color="light"
          onClick={() => {
            onChange(null);
          }}
        >
          Remove
        </Button>
      )}
      <Modal
        isOpen={!!valueToEdit}
        onClose={() => {
          setValueToEdit(undefined);
        }}
      >
        <Modal.Header
          onClose={() => {
            setValueToEdit(undefined);
          }}
        >
          Edit {itemName ?? 'Item'}
        </Modal.Header>
        <Modal.Body>
          {renderForm({ initialData: valueToEdit, onSubmit: handleSubmit })}
        </Modal.Body>
      </Modal>
    </div>
  );
}

interface EmbeddedObjectInputLabelledProps<InputType> extends Props<InputType> {
  label?: React.ReactNode;
  error?: React.ReactNode;
}

EmbeddedObjectInput.Labelled = function EmbeddedOneToOneInputLabelled<
  InputType,
>({
  label,
  className,
  error,
  ...rest
}: EmbeddedObjectInputLabelledProps<InputType>): React.JSX.Element {
  return (
    <div className={clsx('', className)}>
      <div className={className}>
        {label && <FormLabel>{label}</FormLabel>}
        <EmbeddedObjectInput {...rest} />
        {error && <FormError>{error}</FormError>}
      </div>
    </div>
  );
};

interface EmbeddedObjectInputLabelledControllerProps<
  FormType extends FieldValues,
  FormPath extends FieldPath<FormType>,
> extends Omit<
    EmbeddedObjectInputLabelledProps<FieldPathValue<FormType, FormPath>>,
    'onChange' | 'value' | 'error'
  > {
  className?: string;
  control: Control<FormType>;
  name: FormPath;
}

EmbeddedObjectInput.LabelledController =
  function EmbeddedObjectInputLabelledController<
    FormType extends FieldValues,
    FormPath extends FieldPath<FormType>,
  >({
    control,
    name,
    ...rest
  }: EmbeddedObjectInputLabelledControllerProps<
    FormType,
    FormPath
  >): React.JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useController({
      name,
      control,
    });

    return (
      <EmbeddedObjectInput.Labelled
        {...rest}
        error={error?.message}
        onChange={(value) => {
          field.onChange(value as FieldPathValue<FormType, FormPath>);
        }}
        value={field.value}
      />
    );
  };

export default EmbeddedObjectInput;
