import type {
  AdminCrudInputDefinition,
  AdminCrudInputInput,
  AdminCrudSectionConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  Button,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import clsx from 'clsx';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { FieldDialog } from './field-dialog.js';

export type AdminCrudFormConfigInput = Pick<
  AdminCrudSectionConfigInput,
  'form' | 'modelRef'
>;

interface Props {
  className?: string;
  formProps: UseFormReturn<AdminCrudFormConfigInput>;
  embeddedFormOptions: { label: string; value: string }[];
}

function CrudFormFieldsForm({
  className,
  formProps,
  embeddedFormOptions,
}: Props): React.JSX.Element {
  const { control } = formProps;
  const { requestConfirm } = useConfirmDialog();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'form.fields',
  });
  const [editingField, setEditingField] = useState<
    AdminCrudInputInput | undefined
  >(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const formFields = useWatch({ control, name: 'form.fields' });

  function handleDeleteField(fieldIdx: number): void {
    const field = formFields[fieldIdx];
    requestConfirm({
      title: 'Delete Field',
      content: `Are you sure you want to delete the field "${field.label || 'Untitled'}"?`,
      onConfirm: () => {
        remove(fieldIdx);
      },
    });
  }

  function handleEditField(fieldIdx: number): void {
    setEditingField(formFields[fieldIdx]);
    setIsEditing(true);
  }

  function handleCreateField(): void {
    setEditingField(undefined);
    setIsCreating(true);
  }

  function handleSaveField(fieldData: AdminCrudInputDefinition): void {
    if (editingField) {
      const existingIndex = formFields.findIndex(
        (field) => field.id === editingField.id,
      );
      if (existingIndex !== -1) {
        update(existingIndex, fieldData);
      }
    } else {
      append(fieldData);
    }
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {fields.map((field, idx) => (
        <RecordView key={field.id}>
          <RecordViewItemList>
            <RecordViewItem title="Label">
              <div className="flex items-center gap-2">{field.label}</div>
            </RecordViewItem>
            <RecordViewItem title="Type">{field.type}</RecordViewItem>
          </RecordViewItemList>
          <RecordViewActions>
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              aria-label="Edit field"
              onClick={() => {
                handleEditField(idx);
              }}
            >
              <MdEdit />
            </Button>
            <Button
              variant="ghostDestructive"
              size="icon"
              title="Delete"
              aria-label="Delete field"
              onClick={() => {
                handleDeleteField(idx);
              }}
            >
              <MdDeleteOutline />
            </Button>
          </RecordViewActions>
        </RecordView>
      ))}
      <FieldDialog
        open={isEditing || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setIsCreating(false);
            setEditingField(undefined);
          }
        }}
        field={editingField}
        modelRef={useWatch({ control, name: 'modelRef' }) || ''}
        embeddedFormOptions={embeddedFormOptions}
        isNew={isCreating}
        onSave={handleSaveField}
      />
      <Button variant="secondary" size="sm" onClick={handleCreateField}>
        <MdAdd />
        Add Field
      </Button>
    </div>
  );
}

export default CrudFormFieldsForm;
