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

import { RATE_LIMIT_MODELS } from '#src/rate-limit/constants/model-names.js';

import type { RateLimitPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createRateLimitModels } from '../schema/models.js';
import { createRateLimitPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function RateLimitDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const rateLimitPluginDefinitionSchema = useDefinitionSchema(
    createRateLimitPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as RateLimitPluginDefinitionInput;
    }

    const defaultFeatureRef = FeatureUtils.getFeatureIdByNameOrDefault(
      definition,
      'utilities',
    );

    return {
      rateLimitFeatureRef: defaultFeatureRef,
      rateLimitOptions: {},
    } satisfies RateLimitPluginDefinitionInput;
  }, [definition, pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(rateLimitPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit } = form;

  const pluginConfig = pluginMetadata?.config as
    | RateLimitPluginDefinitionInput
    | undefined;

  const pendingModelChanges = useMemo(() => {
    const featureRef = pluginConfig?.rateLimitFeatureRef ?? '';
    if (!featureRef) return undefined;

    const desiredModels = createRateLimitModels(featureRef);

    return createModelMergerResults(
      RATE_LIMIT_MODELS,
      desiredModels,
      definitionContainer,
    );
  }, [definitionContainer, pluginConfig?.rateLimitFeatureRef]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const featureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draftConfig,
          data.rateLimitFeatureRef,
        );
        createAndApplyModelMergerResults(
          draftConfig,
          RATE_LIMIT_MODELS,
          createRateLimitModels(featureRef),
          definitionContainer,
        );
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          {
            ...data,
            rateLimitFeatureRef: featureRef,
          },
          definitionContainer,
        );
      },
      {
        successMessage: 'Successfully saved Rate Limiting configuration!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="ratelimit:relative ratelimit:flex ratelimit:h-full ratelimit:flex-1 ratelimit:flex-col ratelimit:gap-4 ratelimit:overflow-hidden">
      <div
        className="ratelimit:mb-[--action-bar-height] ratelimit:flex ratelimit:flex-1 ratelimit:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form
          onSubmit={onSubmit}
          className="ratelimit:max-w-6xl ratelimit:flex-1"
        >
          <div className="ratelimit:pb-16">
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    General Settings
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Configure the general settings for the rate limiting plugin.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="ratelimit:space-y-6">
                  <FeatureComboboxFieldController
                    label="Feature Path"
                    name="rateLimitFeatureRef"
                    control={control}
                    canCreate
                    description="Specify the feature path where the rate limiting model will be created"
                  />
                </SectionListSectionContent>
              </SectionListSection>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Rate Limiting Models
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    The plugin will automatically configure the models it needs
                    for rate limiting storage.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="ratelimit:space-y-6">
                  {pendingModelChanges ? (
                    <ModelMergerResultAlert
                      pendingModelChanges={pendingModelChanges}
                    />
                  ) : (
                    <p className="ratelimit:text-sm ratelimit:text-muted-foreground">
                      Save to create the RateLimiterFlexible model in your
                      project.
                    </p>
                  )}
                </SectionListSectionContent>
              </SectionListSection>
            </SectionList>
          </div>

          <FormActionBar
            form={form}
            allowSaveWithoutDirty={
              !pluginMetadata ||
              (pendingModelChanges != null &&
                doesModelMergerResultsHaveChanges(pendingModelChanges))
            }
          />
        </form>
      </div>
    </div>
  );
}
