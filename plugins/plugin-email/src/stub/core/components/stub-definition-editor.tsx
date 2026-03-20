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

import { EmailConfigTabs } from '#src/common/index.js';

import type { StubPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createStubPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function StubDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const stubPluginDefinitionSchema = useDefinitionSchema(
    createStubPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as StubPluginDefinitionInput;
    }

    return {
      stubOptions: { providerName: 'stub' },
    } satisfies StubPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(stubPluginDefinitionSchema),
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
        successMessage: 'Successfully saved stub email configuration!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="email:relative email:flex email:h-full email:flex-1 email:flex-col email:gap-4 email:overflow-hidden">
      <EmailConfigTabs />
      <div
        className="email:mb-[--action-bar-height] email:flex email:flex-1 email:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form onSubmit={onSubmit} className="email:max-w-6xl email:flex-1">
          <div className="email:pb-16">
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Stub / Custom Provider Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Configure the stub email provider. This generates a no-op
                    email adapter that logs emails to the console, which you can
                    replace with your own provider implementation.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="email:space-y-6">
                  <InputFieldController
                    label="Provider Name"
                    name="stubOptions.providerName"
                    control={control}
                    description="The name used for the generated adapter (e.g. 'sendgrid', 'ses', 'mailgun'). This affects the generated file and variable names."
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
