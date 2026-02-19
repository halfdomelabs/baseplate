import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
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
import { useController } from 'react-hook-form';
import { MdAdd, MdDeleteOutline, MdEdit } from 'react-icons/md';

import { useEditedModelConfig } from '../../-hooks/use-edited-model-config.js';
import { ModelRelationDialog } from './fields/relations/model-relation-dialog.js';

interface Props {
  control: Control<ModelConfigInput>;
}

export function ModelRelationsSection({ control }: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { definitionContainer } = useProjectDefinition();
  const {
    field: { value: relations = [], onChange: onRelationsChange },
  } = useController({
    name: 'model.relations',
    control,
  });
  const fieldIdsToNames = useEditedModelConfig(({ model }) =>
    Object.fromEntries(model.fields.map((field) => [field.id, field.name])),
  );

  function handleDeleteRelation(relationId: string): void {
    const relation = relations.find((relation) => relation.id === relationId);
    requestConfirm({
      title: 'Delete Relation',
      content: `Are you sure you want to delete the relation "${relation?.name ?? '<invalid>'}"?`,
      onConfirm: () => {
        onRelationsChange(
          relations.filter((relation) => relation.id !== relationId),
        );
      },
    });
  }

  return (
    <SectionListSection>
      <SectionListSectionHeader>
        <SectionListSectionTitle>Relations</SectionListSectionTitle>
        <SectionListSectionDescription>
          Define relations to enforce uniqueness on one or more fields.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="space-y-4">
        {relations.map((relation) => (
          <RecordView key={relation.id}>
            <RecordViewItemList>
              <RecordViewItem title="Name">{relation.name}</RecordViewItem>
              <RecordViewItem title="Local Field">
                {relation.references
                  .map((r) => fieldIdsToNames[r.localRef])
                  .join(', ')}
              </RecordViewItem>
              <RecordViewItem title="Foreign Model">
                {definitionContainer.nameFromId(relation.modelRef)}
              </RecordViewItem>
              <RecordViewItem title="On Delete">
                {relation.onDelete}
              </RecordViewItem>
            </RecordViewItemList>
            <RecordViewActions>
              <ModelRelationDialog
                relationId={relation.id}
                control={control}
                asChild
              >
                <Button variant="ghost" size="icon" title="Edit">
                  <MdEdit />
                </Button>
              </ModelRelationDialog>
              <Button
                variant="ghostDestructive"
                size="icon"
                title="Delete"
                onClick={() => {
                  handleDeleteRelation(relation.id);
                }}
              >
                <MdDeleteOutline />
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <ModelRelationDialog control={control} asChild>
          <Button variant="secondary" size="sm">
            <MdAdd />
            Add Relation
          </Button>
        </ModelRelationDialog>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
