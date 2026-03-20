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

import type { ResendPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createResendPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function ResendDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const resendPluginDefinitionSchema = useDefinitionSchema(
    createResendPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as ResendPluginDefinitionInput;
    }

    return {
      resendOptions: {},
    } satisfies ResendPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(resendPluginDefinitionSchema),
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
        successMessage: 'Successfully saved Resend configuration!',
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
                    Resend Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Resend is configured using the RESEND_API_KEY environment
                    variable. No additional configuration is needed here.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="email:space-y-6">
                  <p className="email:text-sm email:text-muted-foreground">
                    Add your Resend API Key to your environment variables as{' '}
                    <code>RESEND_API_KEY</code>.
                  </p>
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
