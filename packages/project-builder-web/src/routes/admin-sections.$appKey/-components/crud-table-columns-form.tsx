import type {
  AdminCrudSectionConfig,
  AdminCrudTableColumnDefinition,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

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

import { ColumnDialog } from './column-dialog.js';

export type AdminCrudTableConfig = Pick<
  AdminCrudSectionConfig,
  'table' | 'modelRef'
>;

interface Props {
  className?: string;
  control: Control<AdminCrudTableConfig>;
}

function CrudTableColumnsForm({
  className,
  control,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'table.columns',
  });
  const [editingColumn, setEditingColumn] = useState<
    AdminCrudTableColumnDefinition | undefined
  >(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  function handleDeleteColumn(columnIdx: number): void {
    const column = fields[columnIdx];
    requestConfirm({
      title: 'Delete Column',
      content: `Are you sure you want to delete the column "${column.label || 'Untitled'}"?`,
      onConfirm: () => {
        remove(columnIdx);
      },
    });
  }

  const columns = useWatch({ control, name: 'table.columns' });

  function handleEditColumn(columnIdx: number): void {
    setEditingColumn(columns[columnIdx]);
    setIsEditing(true);
  }

  function handleCreateColumn(): void {
    setEditingColumn(undefined);
    setIsCreating(true);
  }

  function handleSaveColumn(columnData: AdminCrudTableColumnDefinition): void {
    if (editingColumn) {
      const existingIndex = columns.findIndex(
        (field) => field.id === editingColumn.id,
      );
      if (existingIndex !== -1) {
        update(existingIndex, columnData);
      }
    } else {
      append(columnData);
    }
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {fields.map((field, idx) => (
        <RecordView key={field.id}>
          <RecordViewItemList>
            <RecordViewItem title="Label">
              <div className="flex items-center gap-2">
                <span>
                  {field.label || (
                    <span className="text-muted-foreground">
                      Untitled Column
                    </span>
                  )}
                </span>
              </div>
            </RecordViewItem>
            <RecordViewItem title="Type">{field.display.type}</RecordViewItem>
          </RecordViewItemList>
          <RecordViewActions>
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              aria-label="Edit column"
              onClick={() => {
                handleEditColumn(idx);
              }}
            >
              <MdEdit />
            </Button>
            <Button
              variant="ghostDestructive"
              size="icon"
              title="Delete"
              aria-label="Delete column"
              onClick={() => {
                handleDeleteColumn(idx);
              }}
            >
              <MdDeleteOutline />
            </Button>
          </RecordViewActions>
        </RecordView>
      ))}
      <ColumnDialog
        open={isEditing || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setIsCreating(false);
            setEditingColumn(undefined);
          }
        }}
        column={editingColumn}
        modelRef={useWatch({ control, name: 'modelRef' }) || ''}
        isNew={isCreating}
        onSave={handleSaveColumn}
      />
      <Button variant="secondary" size="sm" onClick={handleCreateColumn}>
        <MdAdd />
        Add Column
      </Button>
    </div>
  );
}

export default CrudTableColumnsForm;
