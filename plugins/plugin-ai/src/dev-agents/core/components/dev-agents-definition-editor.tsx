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
  MultiSwitchField,
  SectionList,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

import type { DevAgentsPluginDefinitionInput } from '../schema/plugin-definition.js';

import {
  createDevAgentsPluginDefinitionSchema,
  DEV_AGENT_OPTIONS,
} from '../schema/plugin-definition.js';

import '#src/styles.css';

export function DevAgentsDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.ReactElement {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const devAgentsPluginDefinitionSchema = useDefinitionSchema(
    createDevAgentsPluginDefinitionSchema,
  );

  const defaultValues = useMemo(
    (): DevAgentsPluginDefinitionInput =>
      (pluginMetadata?.config as
        | DevAgentsPluginDefinitionInput
        | undefined) ?? {
        enabledAgents: ['claude-code'],
        devAgentsOptions: {},
      },
    [pluginMetadata?.config],
  );

  const form = useResettableForm({
    resolver: zodResolver(devAgentsPluginDefinitionSchema),
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
        successMessage:
          'Successfully saved AI development agents configuration!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="devagents:relative devagents:flex devagents:h-full devagents:flex-1 devagents:flex-col devagents:gap-4 devagents:overflow-hidden">
      <div
        className="devagents:mb-[--action-bar-height] devagents:flex devagents:flex-1 devagents:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form
          onSubmit={onSubmit}
          className="devagents:max-w-6xl devagents:flex-1"
        >
          <div className="devagents:pb-16">
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    AI Development Agents
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Select which AI coding agents your team uses. The plugin
                    will generate appropriate configuration files (AGENTS.md,
                    .agents/ directory) for your project. Agent-specific files
                    like CLAUDE.md and .mcp.json are generated only for selected
                    agents.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent>
                  <MultiSwitchField.Controller
                    control={control}
                    name="enabledAgents"
                    label="Enabled Agents"
                    options={DEV_AGENT_OPTIONS}
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
