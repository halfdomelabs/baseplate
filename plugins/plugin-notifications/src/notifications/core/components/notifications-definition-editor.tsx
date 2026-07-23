import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  applyMergedDefinition,
  authModelsSpec,
  diffDefinition,
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

import type {
  NotificationsPluginDefinition,
  NotificationsPluginDefinitionInput,
} from '../schema/plugin-definition.js';

import { createNotificationsPartialDefinition } from '../schema/models.js';
import { createNotificationsPluginDefinitionSchema } from '../schema/plugin-definition.js';

export function NotificationsDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const notificationsPluginDefinitionSchema = useDefinitionSchema(
    createNotificationsPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as NotificationsPluginDefinitionInput;
    }

    return {
      notificationsFeatureRef: FeatureUtils.getFeatureIdByNameOrDefault(
        definition,
        'notifications',
      ),
    } satisfies NotificationsPluginDefinition;
  }, [definition, pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(notificationsPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit, watch } = form;

  const notificationsFeatureRef = watch('notificationsFeatureRef');

  const authModels = definitionContainer.pluginStore.use(authModelsSpec);
  const userModelName = authModels.getAuthModelsOrThrow(definition).user;

  const notificationsFeatureName = FeatureUtils.resolveFeatureName(
    definition,
    notificationsFeatureRef,
  );

  const partialDef = useMemo(
    () =>
      createNotificationsPartialDefinition(
        notificationsFeatureName,
        userModelName,
      ),
    [notificationsFeatureName, userModelName],
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
        const featureName = FeatureUtils.resolveFeatureName(
          draftConfig,
          data.notificationsFeatureRef,
        );
        const updatedPartialDef = createNotificationsPartialDefinition(
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
            notificationsFeatureRef: FeatureUtils.getFeatureIdByNameOrThrow(
              draftConfig,
              featureName,
            ),
          },
          definitionContainer,
        );
      },
      {
        successMessage: pluginMetadata
          ? 'Successfully saved notifications plugin!'
          : 'Successfully enabled notifications plugin!',
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
      className="notifications:mb-[--action-bar-height] notifications:max-w-6xl"
    >
      <div className="notifications:pb-16">
        <SectionList>
          <SectionListSection>
            <SectionListSectionHeader>
              <SectionListSectionTitle>
                Notifications Configuration
              </SectionListSectionTitle>
              <SectionListSectionDescription>
                Configure where the notification module, API, and feed
                components are generated.
              </SectionListSectionDescription>
            </SectionListSectionHeader>
            <SectionListSectionContent className="notifications:space-y-6">
              <DefinitionDiffAlert
                diff={diff}
                upToDateMessage="All required models are already configured correctly. No changes needed."
              />

              <FeatureComboboxFieldController
                label="Notifications Feature Path"
                name="notificationsFeatureRef"
                control={control}
                canCreate
                description="Specify the feature path where notification endpoints will be generated"
              />
            </SectionListSectionContent>
          </SectionListSection>
        </SectionList>
      </div>

      <FormActionBar
        form={form}
        allowSaveWithoutDirty={!pluginMetadata || diff.hasChanges}
      />
    </form>
  );
}
