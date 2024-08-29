import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import {
  Button,
  RecordView,
  SectionList,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { Control, UseFormSetValue } from 'react-hook-form';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { ModelUniqueConstraintDialog } from './fields/unique-constraints/ModelUniqueConstraintDialog';
import { useEditedModelConfig } from '../../hooks/useEditedModelConfig';

interface Props {
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
}

export function ModelUniqueConstraintsSection({
  control,
  setValue,
}: Props): JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const uniqueConstraints = useEditedModelConfig(
    ({ model }) => model.uniqueConstraints ?? [],
  );
  const fieldIdsToNames = useEditedModelConfig(({ model }) => {
    return Object.fromEntries(
      model.fields.map((field) => [field.id, field.name]),
    );
  });

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
                <Button.WithOnlyIcon icon={MdEdit} title="Edit" />
              </ModelUniqueConstraintDialog>
              <Button.WithOnlyIcon
                icon={MdDeleteOutline}
                title="Delete"
                iconClassName="text-destructive"
                onClick={() => handleDeleteConstraint(constraint.id)}
              />
            </RecordView.Actions>
          </RecordView>
        ))}
        <ModelUniqueConstraintDialog control={control} asChild>
          <Button.WithIcon icon={MdAdd} variant="secondary" size="sm">
            Add Unique Constraint
          </Button.WithIcon>
        </ModelUniqueConstraintDialog>
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
