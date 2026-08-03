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
  NotificationCategoryInput,
  NotificationsPluginDefinitionInput,
} from '../schema/plugin-definition.js';

import { notificationCategoryEntityType } from '../schema/plugin-definition.js';
import { NotificationCategoryDialog } from './notification-category-dialog.js';

interface Props {
  className?: string;
  control: Control<NotificationsPluginDefinitionInput>;
}

function NotificationCategoryEditorForm({
  className,
  control,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { append, update, remove } = useFieldArray({
    control,
    name: 'categories',
  });
  const [categoryToEdit, setCategoryToEdit] = useState<
    NotificationCategoryInput | undefined
  >();
  const [isEditing, setIsEditing] = useState(false);

  const categories = useWatch({ control, name: 'categories' });

  function handleSaveCategory(newCategory: NotificationCategoryInput): void {
    const existingIndex = categories.findIndex(
      (category) => category.id === newCategory.id,
    );
    if (existingIndex === -1) {
      append(newCategory);
    } else {
      update(existingIndex, newCategory);
    }
  }

  function handleDeleteCategory(categoryIdx: number): void {
    const category = categories[categoryIdx];
    if (!category) return;
    requestConfirm({
      title: 'Delete Category',
      content: `Are you sure you want to delete the notification category "${category.key}"? Any notification type declaring it will stop compiling, and existing preference rows for it will be ignored.`,
      onConfirm: () => {
        remove(categoryIdx);
      },
    });
  }

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Categories</SectionListSectionTitle>
        <SectionListSectionDescription>
          Coarse buckets notification types are grouped under. These are the
          rows a user sees on their notification settings page, and the unit
          their preferences are stored against — a type opts into a category,
          and the category decides how it is delivered by default.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="notifications:space-y-4">
        {categories.map((category, categoryIdx) => (
          <RecordView key={category.id}>
            <RecordViewItemList>
              <RecordViewItem title="Key">{category.key}</RecordViewItem>
              <RecordViewItem title="Label">{category.label}</RecordViewItem>
              <RecordViewItem title="Default Channels">
                {category.defaultChannels?.length
                  ? category.defaultChannels.join(', ')
                  : 'None'}
              </RecordViewItem>
              {category.mandatory ? (
                <RecordViewItem title="Mandatory">
                  <span className="notifications:text-muted-foreground">
                    Preferences not consulted
                  </span>
                </RecordViewItem>
              ) : null}
            </RecordViewItemList>
            <RecordViewActions>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                aria-label="Edit notification category"
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
                aria-label="Delete notification category"
                // At least one category must survive: the generated key union
                // would otherwise be `never`, which no type can satisfy.
                disabled={categories.length <= 1}
                onClick={() => {
                  handleDeleteCategory(categoryIdx);
                }}
              >
                Delete
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <NotificationCategoryDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          category={categoryToEdit}
          isNew={
            categoryToEdit
              ? !categories.some(
                  (category) => category.id === categoryToEdit.id,
                )
              : true
          }
          onSave={handleSaveCategory}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCategoryToEdit({
              id: notificationCategoryEntityType.generateNewId(),
              key: '',
              label: '',
              defaultChannels: ['inApp'],
              mandatory: false,
            });
            setIsEditing(true);
          }}
        >
          Add Category
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

export default NotificationCategoryEditorForm;
