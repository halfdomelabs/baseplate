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

import type { PostmarkPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createPostmarkPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function PostmarkDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const postmarkPluginDefinitionSchema = useDefinitionSchema(
    createPostmarkPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as PostmarkPluginDefinitionInput;
    }

    return {
      postmarkOptions: {},
    } satisfies PostmarkPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(postmarkPluginDefinitionSchema),
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
        successMessage: 'Successfully saved Postmark configuration!',
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
                    Postmark Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Postmark is configured using the POSTMARK_SERVER_TOKEN
                    environment variable. No additional configuration is needed
                    here.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="email:space-y-6">
                  <p className="email:text-sm email:text-muted-foreground">
                    Add your Postmark Server API Token to your environment
                    variables as <code>POSTMARK_SERVER_TOKEN</code>.
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
