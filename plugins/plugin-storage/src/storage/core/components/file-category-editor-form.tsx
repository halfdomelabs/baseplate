import type { Control } from 'react-hook-form';

import {
  Button,
  RecordView,
  RecordViewActions,
  RecordViewItem,
  RecordViewItemList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';
import { useState } from 'react';
import { useFieldArray, useWatch } from 'react-hook-form';

import type {
  FileCategoryInput,
  StoragePluginDefinitionInput,
} from '../schema/plugin-definition.js';

import { fileCategoryEntityType } from '../schema/plugin-definition.js';
import { FileCategoryDialog } from './file-category-dialog.js';

interface Props {
  className?: string;
  control: Control<StoragePluginDefinitionInput>;
}

function FileCategoryEditorForm({
  className,
  control,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { append, update, remove } = useFieldArray({
    control,
    name: 'fileCategories',
  });
  const [categoryToEdit, setCategoryToEdit] = useState<
    FileCategoryInput | undefined
  >();
  const [isEditing, setIsEditing] = useState(false);

  const categories = useWatch({ control, name: 'fileCategories' }) ?? [];

  function handleSaveCategory(newCategory: FileCategoryInput): void {
    const existingIndex = categories.findIndex(
      (cat) => cat.id === newCategory.id,
    );
    if (existingIndex === -1) {
      append(newCategory);
    } else {
      update(existingIndex, newCategory);
    }
  }

  function handleDeleteCategory(categoryIdx: number): void {
    const category = categories[categoryIdx];
    requestConfirm({
      title: 'Delete File Category',
      content: `Are you sure you want to delete the file category "${category.name}"?`,
      onConfirm: () => {
        remove(categoryIdx);
      },
    });
  }

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>File Categories</SectionListSectionTitle>
        <SectionListSectionDescription>
          Configure file categories that define upload constraints, storage
          adapters, and authorization rules for file uploads.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="storage:space-y-4">
        {categories.map((category, categoryIdx) => (
          <RecordView key={category.id}>
            <RecordViewItemList>
              <RecordViewItem title="Name">
                <div className="storage:flex storage:items-center storage:gap-2">
                  <span>{category.name}</span>
                </div>
              </RecordViewItem>
              <RecordViewItem title="Max File Size">
                {category.maxFileSizeMb} MB
              </RecordViewItem>
              {category.disableAutoCleanup ? (
                <RecordViewItem title="Auto-Cleanup">
                  <span className="storage:text-muted-foreground">
                    Disabled
                  </span>
                </RecordViewItem>
              ) : null}
            </RecordViewItemList>
            <RecordViewActions>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                aria-label="Edit file category"
                onClick={() => {
                  setCategoryToEdit(category);
                  setIsEditing(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghostDestructive"
                size="icon"
                title="Delete"
                aria-label="Delete file category"
                onClick={() => {
                  handleDeleteCategory(categoryIdx);
                }}
              >
                Delete
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <FileCategoryDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          category={categoryToEdit}
          isNew={
            categoryToEdit
              ? !categories.some((c) => c.id === categoryToEdit.id)
              : true
          }
          onSave={handleSaveCategory}
          parentControl={control}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCategoryToEdit({
              id: fileCategoryEntityType.generateNewId(),
              name: '',
              maxFileSizeMb: 20,
              authorize: { uploadRoles: [] },
              adapterRef: '',
            });
            setIsEditing(true);
          }}
        >
          Add File Category
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

export default FileCategoryEditorForm;
