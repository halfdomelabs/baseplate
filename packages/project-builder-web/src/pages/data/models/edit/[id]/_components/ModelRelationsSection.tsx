import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  RecordView,
  SectionList,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { useEditedModelConfig } from '../../../_hooks/useEditedModelConfig';
import { ModelRelationDialog } from './fields/relations/ModelRelationDialog';

interface Props {
  control: Control<ModelConfig>;
  setValue: UseFormSetValue<ModelConfig>;
}

export function ModelRelationsSection({
  control,
  setValue,
}: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { definitionContainer } = useProjectDefinition();
  const relations = useEditedModelConfig(({ model }) => model.relations ?? []);
  const fieldIdsToNames = useEditedModelConfig(({ model }) =>
    Object.fromEntries(model.fields.map((field) => [field.id, field.name])),
  );

  function handleDeleteRelation(relationId: string): void {
    const relation = relations.find((relation) => relation.id === relationId);
    requestConfirm({
      title: 'Delete Relation',
      content: `Are you sure you want to delete the relation "${relation?.name ?? '<invalid>'}"?`,
      onConfirm: () => {
        setValue(
          'model.relations',
          relations.filter((relation) => relation.id !== relationId),
        );
      },
    });
  }

  return (
    <SectionList.Section>
      <SectionList.SectionHeader>
        <SectionList.SectionTitle>Relations</SectionList.SectionTitle>
        <SectionList.SectionDescription>
          Define relations to enforce uniqueness on one or more fields.
        </SectionList.SectionDescription>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-4">
        {relations.map((relation) => (
          <RecordView key={relation.id}>
            <RecordView.ItemList>
              <RecordView.Item title="Name">{relation.name}</RecordView.Item>
              <RecordView.Item title="Local Field">
                {relation.references
                  .map((r) => fieldIdsToNames[r.localRef])
                  .join(', ')}
              </RecordView.Item>
              <RecordView.Item title="Foreign Model">
                {definitionContainer.nameFromId(relation.modelRef)}
              </RecordView.Item>
              <RecordView.Item title="On Delete">
                {relation.onDelete}
              </RecordView.Item>
            </RecordView.ItemList>
            <RecordView.Actions>
              <ModelRelationDialog
                relationId={relation.id}
                control={control}
                asChild
              >
                <Button.WithOnlyIcon icon={MdEdit} title="Edit" />
              </ModelRelationDialog>
              <Button.WithOnlyIcon
                icon={MdDeleteOutline}
                title="Delete"
                iconClassName="text-destructive"
                onClick={() => {
                  handleDeleteRelation(relation.id);
                }}
              />
            </RecordView.Actions>
          </RecordView>
        ))}
        <ModelRelationDialog control={control} asChild>
          <Button.WithIcon icon={MdAdd} variant="secondary" size="sm">
            Add Relation
          </Button.WithIcon>
        </ModelRelationDialog>
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
