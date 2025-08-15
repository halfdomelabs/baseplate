import type {
  AdminCrudActionDefinition,
  AdminCrudSectionConfig,
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

import { SortableList } from '#src/components/index.js';

import { ActionDialog } from './action-dialog.js';

export type AdminCrudActionsConfig = Pick<
  AdminCrudSectionConfig,
  'table' | 'modelRef'
>;

interface Props {
  className?: string;
  control: Control<AdminCrudActionsConfig>;
  modelRef: string | undefined;
}

function CrudTableActionsForm({
  className,
  control,
  modelRef,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();

  const { fields, append, remove, update, move } = useFieldArray({
    control,
    name: 'table.actions',
  });

  const [editingAction, setEditingAction] = useState<
    AdminCrudActionDefinition | undefined
  >(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  function handleDeleteAction(actionIdx: number): void {
    const action = fields[actionIdx];
    requestConfirm({
      title: 'Delete Action',
      content: `Are you sure you want to delete the "${action.type}" action?`,
      onConfirm: () => {
        remove(actionIdx);
      },
    });
  }

  const actions = useWatch({ control, name: 'table.actions' });

  function handleEditAction(actionIdx: number): void {
    setEditingAction(actions?.[actionIdx]);
    setIsEditing(true);
  }

  function handleCreateAction(): void {
    setEditingAction(undefined);
    setIsCreating(true);
  }

  function handleSaveAction(actionData: AdminCrudActionDefinition): void {
    if (editingAction) {
      const existingIndex = (actions ?? []).findIndex(
        (action) => action.id === editingAction.id,
      );
      if (existingIndex !== -1) {
        update(existingIndex, actionData);
      }
    } else {
      append(actionData);
    }
  }

  const actionListItems = fields.map((field, idx) => ({
    id: field.id,
    element: (
      <RecordView key={field.id}>
        <RecordViewItemList>
          <RecordViewItem title="Type">
            <div className="flex items-center gap-2">
              <span className="capitalize">{field.type}</span>
            </div>
          </RecordViewItem>
          <RecordViewItem title="Position">{field.position}</RecordViewItem>
        </RecordViewItemList>
        <RecordViewActions>
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            aria-label="Edit action"
            onClick={() => {
              handleEditAction(idx);
            }}
          >
            <MdEdit />
          </Button>
          <Button
            variant="ghostDestructive"
            size="icon"
            title="Delete"
            aria-label="Delete action"
            onClick={() => {
              handleDeleteAction(idx);
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
          No actions configured. Add actions to enable row operations.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-2">
          <SortableList listItems={actionListItems} sortItems={move} />
        </div>
      )}
      <ActionDialog
        open={isEditing || isCreating}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setIsCreating(false);
            setEditingAction(undefined);
          }
        }}
        action={editingAction}
        modelRef={modelRef ?? ''}
        isNew={isCreating}
        onSave={handleSaveAction}
      />
      <Button variant="secondary" size="sm" onClick={handleCreateAction}>
        <MdAdd />
        Add Action
      </Button>
    </div>
  );
}

export default CrudTableActionsForm;
