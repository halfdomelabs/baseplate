import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

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
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { useEditedModelConfig } from '../../-hooks/use-edited-model-config.js';
import { ModelUniqueConstraintDialog } from './fields/unique-constraints/model-unique-constraint-dialog.js';

interface Props {
  control: Control<ModelConfigInput>;
  setValue: UseFormSetValue<ModelConfigInput>;
}

export function ModelUniqueConstraintsSection({
  control,
  setValue,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const uniqueConstraints = useEditedModelConfig(
    ({ model }) => model.uniqueConstraints ?? [],
  );
  const fieldIdsToNames = useEditedModelConfig(({ model }) =>
    Object.fromEntries(model.fields.map((field) => [field.id, field.name])),
  );

  function handleDeleteConstraint(constraintId: string): void {
    requestConfirm({
      title: 'Delete Unique Constraint',
      content: 'Are you sure you want to delete this unique constraint?',
      onConfirm: () => {
        setValue(
          'model.uniqueConstraints',
          uniqueConstraints.filter(
            (constraint) => constraint.id !== constraintId,
          ),
        );
      },
    });
  }

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Unique Constraints</SectionListSectionTitle>
        <SectionListSectionDescription>
          Define unique constraints to enforce uniqueness on one or more fields.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="space-y-4">
        {uniqueConstraints.map((constraint) => (
          <RecordView key={constraint.id}>
            <RecordViewItemList>
              <RecordViewItem title="Fields">
                {constraint.fields
                  .map(
                    (field) => fieldIdsToNames[field.fieldRef] ?? '<invalid>',
                  )
                  .join(', ')}
              </RecordViewItem>
            </RecordViewItemList>
            <RecordViewActions>
              <ModelUniqueConstraintDialog
                constraintId={constraint.id}
                control={control}
                asChild
              >
                <Button variant="ghost" size="icon" title="Edit">
                  <MdEdit />
                </Button>
              </ModelUniqueConstraintDialog>
              <Button
                variant="ghostDestructive"
                size="icon"
                title="Delete"
                onClick={() => {
                  handleDeleteConstraint(constraint.id);
                }}
              >
                <MdDeleteOutline />
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <ModelUniqueConstraintDialog control={control} asChild>
          <Button variant="secondary" size="sm">
            <MdAdd />
            Add Unique Constraint
          </Button>
        </ModelUniqueConstraintDialog>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
