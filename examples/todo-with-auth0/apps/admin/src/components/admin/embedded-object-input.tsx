import type { ReactElement } from 'react';
import type { DefaultValues } from 'react-hook-form';

import { useState } from 'react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

export interface EmbeddedObjectFormProps<T> {
  initialData?: DefaultValues<Exclude<T, null | undefined>>;
  onSubmit: (data: T) => void;
}

export interface EmbeddedObjectInputProps<T> {
  className?: string;
  onChange: (value: T | null | undefined) => void;
  renderForm: (options: EmbeddedObjectFormProps<T>) => ReactElement;
  value: T | null | undefined;
  itemName?: string;
  defaultValue?: DefaultValues<T>;
}

export function EmbeddedObjectInput<T>({
  className,
  onChange,
  renderForm,
  value,
  itemName,
  defaultValue = {} as DefaultValues<T>,
}: EmbeddedObjectInputProps<T>): ReactElement {
  const [valueToEdit, setValueToEdit] = useState<
    DefaultValues<Exclude<T, null | undefined>> | undefined
  >();

  const handleSubmit = (data: T): void => {
    onChange(data);
    setValueToEdit(undefined);
  };

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
              setValueToEdit(
                (value ?? defaultValue) as DefaultValues<
                  Exclude<T, null | undefined>
                >,
              );
            }}
          >
            {value ? 'Edit' : 'Create'}
          </Button>
        </DialogTrigger>
        {value && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onChange(null);
            }}
          >
            Remove
          </Button>
        )}
        <DialogContent width="lg">
          <DialogHeader>
            <DialogTitle>Edit {itemName ?? 'Item'}</DialogTitle>
          </DialogHeader>
          {renderForm({ initialData: valueToEdit, onSubmit: handleSubmit })}
        </DialogContent>
      </div>
    </Dialog>
  );
}
