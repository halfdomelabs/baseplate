import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createAndApplyModelMergerResults,
  createModelMergerResults,
  doesModelMergerResultsHaveChanges,
  FeatureUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  FeatureComboboxFieldController,
  ModelMergerResultAlert,
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { STORAGE_MODELS } from '#src/storage/constants/model-names.js';

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition.js';

import { createStorageModels } from '../schema/models.js';
import { createStoragePluginDefinitionSchema } from '../schema/plugin-definition.js';
import AdapterEditorForm from './adapter-editor-form.js';

export function StorageDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const storagePluginDefinitionSchema = useDefinitionSchema(
    createStoragePluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as StoragePluginDefinitionInput;
    }

    return {
      storageFeatureRef: FeatureUtils.getFeatureIdByNameOrDefault(
        definition,
        'storage',
      ),
      s3Adapters: [],
    } satisfies StoragePluginDefinitionInput;
  }, [definition, pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(storagePluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = form;

  const storageFeatureRef = watch('storageFeatureRef');

  const pendingModelChanges = useMemo(() => {
    const desiredModels = createStorageModels(
      { storageFeatureRef },
      definitionContainer,
    );

    return createModelMergerResults(
      STORAGE_MODELS,
      desiredModels,
      definitionContainer,
    );
  }, [definitionContainer, storageFeatureRef]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const featureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draftConfig,
          data.storageFeatureRef,
        );
        const updatedData = {
          ...data,
          storageFeatureRef: featureRef,
        };
        createAndApplyModelMergerResults(
          draftConfig,
          STORAGE_MODELS,
          createStorageModels(updatedData, definitionContainer),
          definitionContainer,
        );
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          data,
          definitionContainer.pluginStore,
        );
      },
      {
        successMessage: pluginMetadata
          ? 'Successfully saved storage plugin!'
          : 'Successfully enabled storage plugin!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <form
      onSubmit={onSubmit}
      className="storage:mb-[--action-bar-height] storage:max-w-6xl"
    >
      <div className="storage:pb-16">
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>
                Storage Configuration
              </SectionListSectionTitle>
              <SectionListSectionDescription>
                Configure your storage settings, file models, and S3 adapters.
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent className="storage:space-y-6">
              <ModelMergerResultAlert
                pendingModelChanges={pendingModelChanges}
              />

              <FeatureComboboxFieldController
                label="Storage Feature Path"
                name="storageFeatureRef"
                control={control}
                canCreate
                description="Specify the feature path where storage endpoints will be generated"
              />
            </SectionListSectionContent>
          </SectionListSection>

          <AdapterEditorForm control={control} />
        </SectionList>
      </div>

      <FormActionBar
        form={form}
        allowSaveWithoutDirty={
          !pluginMetadata ||
          doesModelMergerResultsHaveChanges(pendingModelChanges)
        }
      />
    </form>
  );
}
