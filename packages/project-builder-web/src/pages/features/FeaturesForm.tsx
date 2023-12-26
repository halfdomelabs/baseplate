import {
  FeatureConfig,
  ProjectConfig,
  featureEntityType,
} from '@halfdomelabs/project-builder-lib';
import {
  Button,
  Card,
  cn,
  useConfirmDialog,
} from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { FiCornerDownRight } from 'react-icons/fi';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';

import { FeatureForm } from './FeatureForm';
import { useDeleteReferenceDialog } from '@src/hooks/useDeleteReferenceDialog';
import { useProjectConfig } from '@src/hooks/useProjectConfig';
import { useToast } from '@src/hooks/useToast';
import { logAndFormatError } from '@src/services/error-formatter';

interface FeaturesFormProps {
  className?: string;
}

export function FeaturesForm({ className }: FeaturesFormProps): JSX.Element {
  const { definitionContainer, setConfigAndFixReferences } = useProjectConfig();
  const toast = useToast();
  const { requestConfirm } = useConfirmDialog();
  const { showRefIssues } = useDeleteReferenceDialog();

  const [featureToEdit, setFeatureToEdit] = useState<FeatureConfig>();
  const [showFeatureForm, setShowFeatureForm] = useState(false);

  const features = definitionContainer.definition.features;

  const handleRemoveFeature = (feature: FeatureConfig): void => {
    function deleteFeature(draftConfig: ProjectConfig): void {
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
        try {
          setConfigAndFixReferences(deleteFeature);
          toast.success(`Feature ${feature.name} removed`);
        } catch (err) {
          toast.error(logAndFormatError(err));
        }
      },
    });
  };

  return (
    <Card className={cn('flex flex-col items-start space-y-4 p-4', className)}>
      <h2>Hierarchy</h2>
      <p className="text-muted-foreground">
        All business logic and features are organized in a hierarchy. The
        structure of the features in the list below is the way the folder
        structure will be created in your backend/admin applications.
      </p>
      <div>
        {features.map((feature) => {
          return (
            <div
              key={feature.id}
              className="flex flex-row space-x-2 hover:bg-muted"
            >
              <button
                className="mr-1 flex flex-row items-center space-x-2 rounded-md p-1 "
                onClick={() => {
                  setFeatureToEdit(feature);
                  setShowFeatureForm(true);
                }}
              >
                <div
                  className="flex w-56 items-center overflow-hidden text-ellipsis whitespace-nowrap"
                  title={feature.name.split('/').pop() ?? ''}
                >
                  {feature.name.includes('/') && (
                    <>
                      {feature.name
                        .split('/')
                        .slice(0, -2)
                        .map((name) => (
                          <FiCornerDownRight
                            key={name}
                            className="invisible mr-2 h-4 w-4"
                          />
                        ))}
                      <FiCornerDownRight className="mr-2 h-4 w-4" />
                    </>
                  )}
                  <div>{feature.name.split('/').pop() ?? ''}</div>
                </div>
                <MdEdit />
              </button>
              <Button.WithIcon
                variant="ghost"
                onClick={() => handleRemoveFeature(feature)}
                size="icon"
                icon={MdDelete}
                title={`Delete ${feature.name}`}
              />
              <Button.WithIcon
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
                icon={MdAdd}
                title={`Add Sub-Feature to ${feature.name}`}
              />
            </div>
          );
        })}
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
      >
        Add Feature
      </Button>
      <FeatureForm
        feature={featureToEdit}
        open={showFeatureForm}
        onClose={() => setShowFeatureForm(false)}
      />
    </Card>
  );
}
