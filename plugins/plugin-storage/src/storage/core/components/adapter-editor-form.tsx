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

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition.js';

import { storageAdapterEntityType } from '../schema/plugin-definition.js';
import { AdapterDialog } from './adapter-dialog.js';

interface Props {
  className?: string;
  control: Control<StoragePluginDefinitionInput>;
}

function AdapterEditorForm({ className, control }: Props): React.JSX.Element {
  const { requestConfirm } = useConfirmDialog();
  const { append, update, remove } = useFieldArray({
    control,
    name: 's3Adapters',
  });
  const [adapterToEdit, setAdapterToEdit] = useState<
    StoragePluginDefinitionInput['s3Adapters'][0] | undefined
  >();
  const [isEditing, setIsEditing] = useState(false);

  const adapters = useWatch({ control, name: 's3Adapters' });

  function handleSaveAdapter(
    newAdapter: StoragePluginDefinitionInput['s3Adapters'][0],
  ): void {
    const existingIndex = adapters.findIndex(
      (adapter) => adapter.id === newAdapter.id,
    );
    if (existingIndex === -1) {
      append(newAdapter);
    } else {
      update(existingIndex, newAdapter);
    }
  }

  function handleDeleteAdapter(adapterIdx: number): void {
    const adapter = adapters[adapterIdx];
    requestConfirm({
      title: 'Delete Adapter',
      content: `Are you sure you want to delete the adapter "${adapter.name}"?`,
      onConfirm: () => {
        remove(adapterIdx);
      },
    });
  }

  return (
    <SectionListSection className={className}>
      <SectionListSectionHeader>
        <SectionListSectionTitle>S3 Adapters</SectionListSectionTitle>
        <SectionListSectionDescription>
          Configure S3 storage adapters for file uploads. Each adapter can have
          its own bucket and configuration.
        </SectionListSectionDescription>
      </SectionListSectionHeader>
      <SectionListSectionContent className="storage:space-y-4">
        {adapters.map((adapter, adapterIdx) => (
          <RecordView key={adapter.id}>
            <RecordViewItemList>
              <RecordViewItem title="Name">
                <div className="storage:flex storage:items-center storage:gap-2">
                  <span>{adapter.name}</span>
                </div>
              </RecordViewItem>
              <RecordViewItem title="Bucket Config Variable">
                {adapter.bucketConfigVar || (
                  <span className="storage:text-muted-foreground">
                    Not configured
                  </span>
                )}
              </RecordViewItem>
              <RecordViewItem title="URL Prefix Config Variable">
                {adapter.hostedUrlConfigVar ?? (
                  <span className="storage:text-muted-foreground">
                    Not configured
                  </span>
                )}
              </RecordViewItem>
            </RecordViewItemList>
            <RecordViewActions>
              <Button
                variant="ghost"
                size="icon"
                title="Edit"
                aria-label="Edit adapter"
                onClick={() => {
                  setAdapterToEdit(adapter);
                  setIsEditing(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghostDestructive"
                size="icon"
                title="Delete"
                aria-label="Delete adapter"
                onClick={() => {
                  handleDeleteAdapter(adapterIdx);
                }}
              >
                Delete
              </Button>
            </RecordViewActions>
          </RecordView>
        ))}
        <AdapterDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          adapter={adapterToEdit}
          isNew={
            adapterToEdit
              ? !adapters.some((a) => a.id === adapterToEdit.id)
              : true
          }
          onSave={handleSaveAdapter}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAdapterToEdit({
              id: storageAdapterEntityType.generateNewId(),
              name: '',
              bucketConfigVar: '',
              hostedUrlConfigVar: '',
            });
            setIsEditing(true);
          }}
        >
          Add Adapter
        </Button>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

export default AdapterEditorForm;
