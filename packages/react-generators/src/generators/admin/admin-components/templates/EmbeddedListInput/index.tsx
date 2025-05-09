// @ts-nocheck

import type { ReactElement } from 'react';
import type {
  Control,
  DefaultValues,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';

import {
  Alert,
  Button,
  FormError,
  FormLabel,
  Modal,
} from '%reactComponentsImports';
import clsx from 'clsx';
import { nanoid } from 'nanoid';
import { useMemo, useState } from 'react';
import { useController } from 'react-hook-form';

export interface EmbeddedListTableProps<InputType> {
  items: (InputType & { id: string })[];
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
  renderTable: (tableProps: EmbeddedListTableProps<InputType>) => ReactElement;
  renderForm: (formProps: EmbeddedListFormProps<InputType>) => ReactElement;
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
}: Props<InputType>): ReactElement {
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

  // TODO: Improve with better ID tracking
  // We don't have a good way of making sure each row has a unique key
  // so since we rarely update items, we just re-assign a random ID every time
  // the values change
  const valueWithIds = useMemo(
    () => (value ?? []).map((item) => ({ id: nanoid(), ...item })),
    [value],
  );

  return (
    <div className={clsx('space-y-2', className)}>
      <Button
        size="small"
        onClick={() => {
          setValueToEdit({ data: defaultValue });
        }}
      >
        Add Item
      </Button>
      {definedValue.length > 0 ? (
        renderTable({
          items: valueWithIds,
          edit: (idx) => {
            setValueToEdit({
              idx,
              data: definedValue[idx] as DefaultValues<InputType>,
            });
          },
          remove: (idx) => {
            onChange(definedValue.filter((_, i) => i !== idx));
          },
        })
      ) : (
        <Alert type="info">No items currently</Alert>
      )}
      <Modal
        isOpen={!!valueToEdit}
        onClose={() => {
          setValueToEdit(undefined);
        }}
        width="large"
      >
        <Modal.Header
          onClose={() => {
            setValueToEdit(undefined);
          }}
        >
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
}: EmbeddedListInputLabelledProps<InputType>): ReactElement {
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
  >): ReactElement {
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
        onChange={(value) => {
          field.onChange(value as FieldPathValue<FormType, FormPath>);
        }}
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
