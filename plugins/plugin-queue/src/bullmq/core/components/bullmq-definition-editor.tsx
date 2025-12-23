import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { PluginUtils } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
  useDefinitionSchema,
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import {
  FormActionBar,
  InputFieldController,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import { QueueConfigTabs } from '#src/common/index.js';

import type { BullmqPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createBullmqPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function BullmqDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const bullmqPluginDefinitionSchema = useDefinitionSchema(
    createBullmqPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as BullmqPluginDefinitionInput;
    }

    return {
      bullmqOptions: {
        deleteAfterDays: 7,
      },
    } satisfies BullmqPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(bullmqPluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit } = form;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          data,
          definitionContainer,
        );
      },
      {
        successMessage: 'Successfully saved BullMQ configuration!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="queue:relative queue:flex queue:h-full queue:flex-1 queue:flex-col queue:gap-4 queue:overflow-hidden">
      <QueueConfigTabs />
      <div
        className="queue:mb-[--action-bar-height] queue:flex queue:flex-1 queue:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form onSubmit={onSubmit} className="queue:max-w-6xl queue:flex-1">
          <div className="queue:pb-16">
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Queue Behavior
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Configure how BullMQ manages jobs and queues.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="queue:space-y-6">
                  <InputFieldController
                    label="Delete After Days"
                    name="bullmqOptions.deleteAfterDays"
                    control={control}
                    type="number"
                    min={1}
                    description="Number of days to retain completed jobs before deletion"
                    registerOptions={{
                      valueAsNumber: true,
                    }}
                  />
                </SectionListSectionContent>
              </SectionListSection>
            </SectionList>
          </div>

          <FormActionBar form={form} allowSaveWithoutDirty={!pluginMetadata} />
        </form>
      </div>
    </div>
  );
}
