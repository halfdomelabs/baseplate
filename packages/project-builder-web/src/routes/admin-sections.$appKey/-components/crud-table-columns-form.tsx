import type {
  AdminCrudColumnDefinition,
  AdminCrudColumnInput,
} from '@baseplate-dev/project-builder-lib';
import type { Lens } from '@hookform/lenses';
import type React from 'react';

import {
  Button,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { useFieldArray } from '@hookform/lenses/rhf';
import clsx from 'clsx';
import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { SortableList } from '#src/components/index.js';

import { ColumnDialog } from './column-dialog.js';

interface Props {
  className?: string;
  lens: Lens<AdminCrudColumnInput[]>;
  modelRef: string;
}

function CrudTableColumnsForm({
  className,
  lens,
  modelRef,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();

  const { fields, append, remove, update, move } = useFieldArray(
    lens.interop(),
  );
  const [editingColumn, setEditingColumn] = useState<
    AdminCrudColumnInput | undefined
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

  const columns = useWatch(lens.interop());

  function handleEditColumn(columnIdx: number): void {
    setEditingColumn(columns[columnIdx]);
    setIsEditing(true);
  }

  function handleCreateColumn(): void {
    setEditingColumn(undefined);
    setIsCreating(true);
  }

  function handleSaveColumn(columnData: AdminCrudColumnDefinition): void {
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

  const columnListItems = fields.map((field, idx) => ({
    id: field.id,
    element: (
      <RecordView key={field.id}>
        <RecordViewItemList>
          <RecordViewItem title="Label">
            <div className="flex items-center gap-2">
              <span>
                {field.label || (
                  <span className="text-muted-foreground">Untitled Column</span>
                )}
              </span>
            </div>
          </RecordViewItem>
          <RecordViewItem title="Type">{field.type}</RecordViewItem>
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
    ),
  }));

  return (
    <div className={clsx('space-y-4', className)}>
      {fields.length === 0 ? (
        <p className="pt-4 text-style-muted">
          No columns configured. Add columns to display data in your table.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-2">
          <SortableList listItems={columnListItems} sortItems={move} />
        </div>
      )}
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
        modelRef={modelRef}
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
