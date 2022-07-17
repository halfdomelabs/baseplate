// @ts-nocheck

import classNames from 'classnames';
import { useState } from 'react';
import {
  Control,
  FieldPath,
  FieldPathValue,
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
  initialData?: Partial<InputType>;
  onSubmit: (data: InputType) => void;
}

interface Props<InputType> {
  className?: string;
  onChange: (value: InputType[]) => void;
  tableElement: React.FC<EmbeddedListTableProps<InputType>>;
  formElement: React.FC<EmbeddedListFormProps<InputType>>;
  value: InputType[];
  itemName?: string;
}

function EmbeddedListInput<InputType>({
  className,
  onChange,
  tableElement: TableElement,
  formElement: FormElement,
  value,
  itemName,
}: Props<InputType>): JSX.Element {
  const [valueToEdit, setValueToEdit] = useState<
    { idx?: number; data: Partial<InputType> } | undefined
  >();

  const handleSubmit = (data: InputType): void => {
    if (valueToEdit?.idx === undefined) {
      onChange([...value, data]);
    } else {
      onChange(
        value.map((item, idx) => (idx === valueToEdit.idx ? data : item))
      );
    }
    setValueToEdit(undefined);
  };

  return (
    <div className={classNames('space-y-2', className)}>
      <Button size="small" onClick={() => setValueToEdit({ data: {} })}>
        Add Item
      </Button>
      {value.length ? (
        <TableElement
          items={value}
          edit={(idx) => setValueToEdit({ idx, data: value[idx] })}
          remove={(idx) => onChange(value.filter((_, i) => i !== idx))}
        />
      ) : (
        <Alert type="info">No items currently</Alert>
      )}
      <Modal isOpen={!!valueToEdit} onClose={() => setValueToEdit(undefined)}>
        <Modal.Header onClose={() => setValueToEdit(undefined)}>
          Edit {itemName || 'Item'}
        </Modal.Header>
        <Modal.Body>
          <FormElement
            initialData={valueToEdit?.data}
            onSubmit={handleSubmit}
          />
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
    <div className={classNames('', className)}>
      <div className={className}>
        {label && <FormLabel>{label}</FormLabel>}
        <EmbeddedListInput {...rest} />
        {error && <FormError>{error}</FormError>}
      </div>
    </div>
  );
};

interface EmbeddedListInputLabelledControllerProps<
  FormType,
  FormPath extends FieldPath<FormType>
> extends Omit<
    EmbeddedListInputLabelledProps<
      FieldPathValue<FormType, FormPath> extends (infer InputType)[]
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
    FormType,
    FormPath extends FieldPath<FormType>
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
        onChange={field.onChange}
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
