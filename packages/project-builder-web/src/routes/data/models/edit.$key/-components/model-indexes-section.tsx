import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
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
import { useController, useWatch } from 'react-hook-form';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { ModelIndexDialog } from './fields/indexes/model-index-dialog.js';

interface Props {
  control: Control<ModelConfigInput>;
}

export function ModelIndexesSection({ control }: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const {
    field: { value: indexes = [], onChange: onIndexesChange },
  } = useController({
    name: 'model.indexes',
    control,
  });
  const fieldIdsToNames = useWatch({
    control,
    name: 'model.fields',
    compute: (fields) =>
      Object.fromEntries(fields.map((field) => [field.id, field.name])),
  });

  function handleDeleteIndex(indexId: string): void {
    requestConfirm({
      title: 'Delete Index',
      content: 'Are you sure you want to delete this index?',
      onConfirm: () => {
        onIndexesChange(indexes.filter((index) => index.id !== indexId));
      },
    });
  }

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Indexes</SectionListSectionTitle>
        <SectionListSectionDescription>
          Define indexes to improve query performance on one or more fields.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="space-y-4">
        {indexes.map((index) => (
          <RecordView key={index.id}>
            <RecordViewItemList>
              <RecordViewItem title="Fields">
                {index.fields
                  .map(
                    (field) => fieldIdsToNames[field.fieldRef] ?? '<invalid>',
                  )
                  .join(', ')}
              </RecordViewItem>
            </RecordViewItemList>
            <RecordViewActions>
              <ModelIndexDialog
                indexId={index.id}
                control={control}
                trigger={
                  <Button variant="ghost" size="icon" title="Edit">
                    <MdEdit />
                  </Button>
                }
              />
              <Button
                variant="ghostDestructive"
                size="icon"
                title="Delete"
                onClick={() => {
                  handleDeleteIndex(index.id);
                }}
              >
                <MdDeleteOutline />
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <ModelIndexDialog
          control={control}
          trigger={
            <Button variant="secondary" size="sm">
              <MdAdd />
              Add Index
            </Button>
          }
        />
      </SectionListSectionContent>
    </SectionListSection>
  );
}
