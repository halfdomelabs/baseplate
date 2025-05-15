import type {
  FeatureConfig,
  ProjectDefinition,
} from '@halfdomelabs/project-builder-lib';
import type React from 'react';

import { featureEntityType } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Button,
  buttonVariants,
  cn,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { FiCornerDownRight } from 'react-icons/fi';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';

import { FeatureForm } from './components/FeatureForm';

function HierarchyPage(): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedbackSync } =
    useProjectDefinition();
  const { requestConfirm } = useConfirmDialog();
  const { showRefIssues } = useDeleteReferenceDialog();

  const [featureToEdit, setFeatureToEdit] = useState<FeatureConfig>();
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  const { features } = definitionContainer.definition;

  const handleRemoveFeature = (feature: FeatureConfig): void => {
    function deleteFeature(draftConfig: ProjectDefinition): void {
      const idx = draftConfig.features.findIndex((f) => f.id === feature.id);
      if (idx === -1) {
        throw new Error('Feature not found');
      }
      draftConfig.features.splice(idx, 1);
    }

    // try deleting the feature
    const result = definitionContainer.fixRefDeletions(deleteFeature);
    if (result.type === 'failure') {
      showRefIssues({ issues: result.issues });
      return;
    }

    requestConfirm({
      title: 'Delete Feature',
      content: `Are you sure you want to delete ${feature.name}?`,
      onConfirm: () => {
        saveDefinitionWithFeedbackSync(deleteFeature, {
          successMessage: `Feature ${feature.name} removed`,
        });
      },
    });
  };

  return (
    <div className="relative h-full max-h-full pb-(--action-bar-height)">
      <div className="flex h-full max-h-full flex-1 flex-col overflow-y-auto px-6">
        <div className="sticky top-0 space-y-2 border-b bg-background py-6">
          <h1>Hierarchy</h1>
          <p className="max-w-3xl text-muted-foreground">
            All business logic and features are organized in a hierarchy. The
            structure of the features in the list below is the way the folder
            structure will be created in your backend/admin applications.
          </p>
        </div>
        <div className="py-6">
          <div className="mb-4 flex max-w-md flex-col gap-1">
            {features.map((feature) => (
              <FeatureItem
                key={feature.id}
                feature={feature}
                setFeatureToEdit={setFeatureToEdit}
                setShowFeatureForm={setShowFeatureForm}
                handleRemoveFeature={handleRemoveFeature}
              />
            ))}
          </div>
          <Button
            onClick={() => {
              setFeatureToEdit({
                id: featureEntityType.generateNewId(),
                name: '',
                parentRef: null,
              });
              setShowFeatureForm(true);
            }}
            variant="secondary"
            size="sm"
          >
            Add Feature
          </Button>
          <FeatureForm
            feature={featureToEdit}
            open={showFeatureForm}
            onClose={() => {
              setShowFeatureForm(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  feature,
  setFeatureToEdit,
  setShowFeatureForm,
  handleRemoveFeature,
}: {
  feature: FeatureConfig;
  setFeatureToEdit: (f: FeatureConfig) => void;
  setShowFeatureForm: (s: boolean) => void;
  handleRemoveFeature: (f: FeatureConfig) => void;
}): React.JSX.Element {
  const featureDisplayName = feature.name.split('/').pop() ?? '';

  return (
    <div className="flex space-x-1">
      <button
        className="mr-1 flex w-full flex-row items-center space-x-3"
        onClick={() => {
          setFeatureToEdit(feature);
          setShowFeatureForm(true);
        }}
      >
        <div
          className="flex w-full items-center space-x-1 truncate"
          title={featureDisplayName}
        >
          {feature.name.includes('/') && (
            <>
              {feature.name
                .split('/')
                .slice(0, -2)
                .map((name) => (
                  <div key={name} className="w-8 shrink-0" />
                ))}
              <FiCornerDownRight className="size-8 shrink-0 p-2" />
            </>
          )}
          <div
            className={cn(
              buttonVariants({
                variant: 'secondary',
                size: 'sm',
              }),
              'group w-full',
            )}
            style={{ justifyContent: 'flex-start' }}
          >
            {featureDisplayName}
            <div className="flex-1" />
            <MdEdit className="opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </button>
      <Button
        className="shrink-0"
        variant="ghost"
        onClick={() => {
          setFeatureToEdit({
            id: featureEntityType.generateNewId(),
            name: '',
            parentRef: feature.id,
          });
          setShowFeatureForm(true);
        }}
        size="icon"
        title={`Add Sub-Feature to ${feature.name}`}
      >
        <MdAdd />
      </Button>
      <Button
        className="shrink-0"
        variant="ghostDestructive"
        onClick={() => {
          handleRemoveFeature(feature);
        }}
        size="icon"
        title={`Delete ${feature.name}`}
      >
        <MdDelete />
      </Button>
    </div>
  );
}

export default HierarchyPage;
