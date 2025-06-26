// @ts-nocheck

import type { ReactElement } from 'react';
import type { DefaultValues } from 'react-hook-form';

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '%reactComponentsImports';
import { nanoid } from 'nanoid';
import { useMemo, useState } from 'react';

export interface EmbeddedListTableProps<T> {
  items: (T & { id: string })[];
  edit: (index: number) => void;
  remove: (index: number) => void;
}

export interface EmbeddedListFormProps<T> {
  initialData?: DefaultValues<T>;
  onSubmit: (data: T) => void;
}

export interface EmbeddedListInputProps<T> {
  className?: string;
  onChange: (value: T[]) => void;
  renderTable: (tableProps: EmbeddedListTableProps<T>) => ReactElement;
  renderForm: (formProps: EmbeddedListFormProps<T>) => ReactElement;
  value: T[] | null | undefined;
  itemName?: string;
  defaultValue?: DefaultValues<T>;
}

export function EmbeddedListInput<T>({
  className,
  onChange,
  renderTable,
  renderForm,
  value,
  itemName,
  defaultValue = {} as DefaultValues<T>,
}: EmbeddedListInputProps<T>): ReactElement {
  const [valueToEdit, setValueToEdit] = useState<
    { idx?: number; data: DefaultValues<T> } | undefined
  >();

  const definedValue = value ?? [];

  const handleSubmit = (data: T): void => {
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
    <Dialog
      open={!!valueToEdit}
      onOpenChange={(open) => {
        if (!open) {
          setValueToEdit(undefined);
        }
      }}
    >
      <div className={className}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            onClick={() => {
              setValueToEdit({ data: defaultValue });
            }}
          >
            Add Item
          </Button>
        </DialogTrigger>
        {definedValue.length > 0 ? (
          renderTable({
            items: valueWithIds,
            edit: (idx) => {
              setValueToEdit({
                idx,
                data: definedValue[idx] as DefaultValues<T>,
              });
            },
            remove: (idx) => {
              onChange(definedValue.filter((_, i) => i !== idx));
            },
          })
        ) : (
          <Alert variant="default">No items currently</Alert>
        )}
        <DialogContent width="lg">
          <DialogHeader>
            <DialogTitle>Edit {itemName ?? 'Item'}</DialogTitle>
          </DialogHeader>
          {renderForm({
            initialData: valueToEdit?.data,
            onSubmit: handleSubmit,
          })}
        </DialogContent>
      </div>
    </Dialog>
  );
}
