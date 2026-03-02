import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  applyMergedDefinition,
  authModelsSpec,
  diffDefinition,
  featureEntityType,
  FeatureUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  DefinitionDiffAlert,
  FeatureComboboxFieldController,
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

import type { StoragePluginDefinitionInput } from '../schema/plugin-definition.js';

import { createStoragePartialDefinition } from '../schema/models.js';
import { createStoragePluginDefinitionSchema } from '../schema/plugin-definition.js';
import AdapterEditorForm from './adapter-editor-form.js';

function resolveFeatureName(
  definition: Parameters<typeof FeatureUtils.getFeaturePathById>[0],
  featureRef: string,
): string {
  if (featureEntityType.isId(featureRef)) {
    return FeatureUtils.getFeaturePathById(definition, featureRef);
  }
  return featureRef;
}

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

  const authModels = definitionContainer.pluginStore.use(authModelsSpec);
  const userModelName = authModels.getAuthModelsOrThrow(definition).user;

  const storageFeatureName = resolveFeatureName(definition, storageFeatureRef);

  const partialDef = useMemo(
    () => createStoragePartialDefinition(storageFeatureName, userModelName),
    [storageFeatureName, userModelName],
  );

  const diff = useMemo(
    () =>
      diffDefinition(
        definitionContainer.schema,
        definitionContainer.definition,
        partialDef,
      ),
    [definitionContainer, partialDef],
  );

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const featureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draftConfig,
          data.storageFeatureRef,
        );
        const featureName = resolveFeatureName(draftConfig, featureRef);
        const updatedPartialDef = createStoragePartialDefinition(
          featureName,
          userModelName,
        );
        applyMergedDefinition(
          definitionContainer,
          updatedPartialDef,
        )(draftConfig);
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          {
            ...data,
            storageFeatureRef: featureRef,
          },
          definitionContainer,
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
              <DefinitionDiffAlert
                diff={diff}
                upToDateMessage="All required models are already configured correctly. No changes needed."
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
        allowSaveWithoutDirty={!pluginMetadata || diff.hasChanges}
      />
    </form>
  );
}
