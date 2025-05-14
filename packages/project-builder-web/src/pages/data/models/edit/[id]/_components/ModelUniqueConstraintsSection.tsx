import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import {
  Button,
  RecordView,
  SectionList,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { useEditedModelConfig } from '../../../_hooks/useEditedModelConfig';
import { ModelUniqueConstraintDialog } from './fields/unique-constraints/ModelUniqueConstraintDialog';

interface Props {
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
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
    <SectionList.Section>
      <SectionList.SectionHeader>
        <SectionList.SectionTitle>Unique Constraints</SectionList.SectionTitle>
        <SectionList.SectionDescription>
          Define unique constraints to enforce uniqueness on one or more fields.
        </SectionList.SectionDescription>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-4">
        {uniqueConstraints.map((constraint) => (
          <RecordView key={constraint.id}>
            <RecordView.ItemList>
              <RecordView.Item title="Fields">
                {constraint.fields
                  .map(
                    (field) => fieldIdsToNames[field.fieldRef] ?? '<invalid>',
                  )
                  .join(', ')}
              </RecordView.Item>
            </RecordView.ItemList>
            <RecordView.Actions>
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
            </RecordView.Actions>
          </RecordView>
        ))}
        <ModelUniqueConstraintDialog control={control} asChild>
          <Button variant="secondary" size="sm">
            <MdAdd />
            Add Unique Constraint
          </Button>
        </ModelUniqueConstraintDialog>
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
