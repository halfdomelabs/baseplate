import clsx from 'clsx';
import { useState } from 'react';
import {
  Control,
  DefaultValues,
  FieldPath,
  FieldPathValue,
  FieldValues,
  useController,
} from 'react-hook-form';

import Alert from '../Alert';
import Button from '../Button';
import FormError from '../FormError';
import FormLabel from '../FormLabel';
import Modal from '../Modal';

export interface EmbeddedListTableProps<InputType> {
  items: InputType[];
  edit: (index: number) => void;
  remove: (index: number) => void;
}

export interface EmbeddedListFormProps<InputType> {
  initialData?: DefaultValues<InputType>;
  onSubmit: (data: InputType) => void;
}

interface Props<InputType> {
  className?: string;
  onChange: (value: InputType[]) => void;
  renderTable: (tableProps: EmbeddedListTableProps<InputType>) => JSX.Element;
  renderForm: (formProps: EmbeddedListFormProps<InputType>) => JSX.Element;
  value: InputType[] | null | undefined;
  itemName?: string;
  defaultValue?: DefaultValues<InputType>;
}

function EmbeddedListInput<InputType>({
  className,
  onChange,
  renderTable,
  renderForm,
  value,
  itemName,
  defaultValue = {} as DefaultValues<InputType>,
}: Props<InputType>): JSX.Element {
  const [valueToEdit, setValueToEdit] = useState<
    { idx?: number; data: DefaultValues<InputType> } | undefined
  >();

  const definedValue = value ?? [];

  const handleSubmit = (data: InputType): void => {
    if (valueToEdit?.idx === undefined) {
      onChange([...definedValue, data]);
    } else {
      onChange(
        definedValue.map((item, idx) =>
          idx === valueToEdit.idx ? data : item,
        ),
      );
    }
    setValueToEdit(undefined);
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <Button
        size="small"
        onClick={() => setValueToEdit({ data: defaultValue })}
      >
        Add Item
      </Button>
      {definedValue.length ? (
        renderTable({
          items: definedValue,
          edit: (idx) =>
            setValueToEdit({
              idx,
              data: definedValue[idx] as DefaultValues<InputType>,
            }),
          remove: (idx) => onChange(definedValue.filter((_, i) => i !== idx)),
        })
      ) : (
        <Alert type="info">No items currently</Alert>
      )}
      <Modal isOpen={!!valueToEdit} onClose={() => setValueToEdit(undefined)}>
        <Modal.Header onClose={() => setValueToEdit(undefined)}>
          Edit {itemName ?? 'Item'}
        </Modal.Header>
        <Modal.Body>
          {renderForm({
            initialData: valueToEdit?.data,
            onSubmit: handleSubmit,
          })}
        </Modal.Body>
      </Modal>
    </div>
  );
}

interface EmbeddedListInputLabelledProps<InputType> extends Props<InputType> {
  label?: React.ReactNode;
  error?: React.ReactNode;
}

EmbeddedListInput.Labelled = function EmbeddedOneToOneInputLabelled<InputType>({
  label,
  className,
  error,
  ...rest
}: EmbeddedListInputLabelledProps<InputType>): JSX.Element {
  return (
    <div className={clsx('', className)}>
      <div className={className}>
        {label && <FormLabel>{label}</FormLabel>}
        <EmbeddedListInput {...rest} />
        {error && <FormError>{error}</FormError>}
      </div>
    </div>
  );
};

interface EmbeddedListInputLabelledControllerProps<
  FormType extends FieldValues,
  FormPath extends FieldPath<FormType>,
> extends Omit<
    EmbeddedListInputLabelledProps<
      Exclude<
        FieldPathValue<FormType, FormPath>,
        undefined | null
      > extends (infer InputType)[]
        ? InputType
        : never
    >,
    'onChange' | 'value' | 'error'
  > {
  className?: string;
  control: Control<FormType>;
  name: FormPath;
}

EmbeddedListInput.LabelledController =
  function EmbeddedListInputLabelledController<
    FormType extends FieldValues,
    FormPath extends FieldPath<FormType>,
  >({
    className,
    control,
    name,
    ...rest
  }: EmbeddedListInputLabelledControllerProps<
    FormType,
    FormPath
  >): JSX.Element {
    const {
      field,
      fieldState: { error },
    } = useController({
      name,
      control,
    });

    return (
      <EmbeddedListInput.Labelled
        {...rest}
        error={error?.message}
        onChange={(value) =>
          field.onChange(value as FieldPathValue<FormType, FormPath>)
        }
        value={
          field.value as (FieldPathValue<
            FormType,
            FormPath
          > extends (infer InputType)[]
            ? InputType
            : never)[]
        }
      />
    );
  };

export default EmbeddedListInput;
