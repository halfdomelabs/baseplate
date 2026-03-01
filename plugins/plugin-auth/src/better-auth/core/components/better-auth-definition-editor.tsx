import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  createAndApplyModelMergerResults,
  createModelMergerResults,
  doesModelMergerResultsHaveChanges,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import {
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

import { getAuthPluginDefinition } from '#src/auth/utils/get-auth-plugin-definition.js';
import { BETTER_AUTH_MODELS } from '#src/better-auth/constants/model-names.js';
import { AuthConfigTabs } from '#src/common/components/auth-config-tabs.js';

import type { BetterAuthPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createBetterAuthModels } from '../schema/models.js';
import { createBetterAuthPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function BetterAuthDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const betterAuthPluginDefinitionSchema = useDefinitionSchema(
    createBetterAuthPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as BetterAuthPluginDefinitionInput;
    }

    return {} satisfies BetterAuthPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(betterAuthPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit } = form;

  const authDefinition = getAuthPluginDefinition(definition);

  const pendingModelChanges = useMemo(() => {
    const desiredModels = createBetterAuthModels(authDefinition);

    return createModelMergerResults(
      BETTER_AUTH_MODELS,
      desiredModels,
      definitionContainer,
    );
  }, [definitionContainer, authDefinition]);

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        const updatedData = {
          ...data,
        };
        createAndApplyModelMergerResults(
          draftConfig,
          BETTER_AUTH_MODELS,
          createBetterAuthModels(authDefinition),
          definitionContainer,
        );
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          updatedData,
          definitionContainer,
        );
      },
      {
        successMessage: 'Successfully saved Better Auth plugin!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="auth:relative auth:flex auth:h-full auth:flex-1 auth:flex-col auth:gap-4 auth:overflow-hidden">
      <AuthConfigTabs />
      <div
        className="auth:mb-[--action-bar-height] auth:flex auth:flex-1 auth:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form onSubmit={onSubmit} className="auth:max-w-6xl auth:flex-1">
          <div className="auth:pb-16">
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Better Auth Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    The plugin will automatically configure the models it needs.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="auth:space-y-6">
                  <ModelMergerResultAlert
                    pendingModelChanges={pendingModelChanges}
                  />
                </SectionListSectionContent>
              </SectionListSection>
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
      </div>
    </div>
  );
}
