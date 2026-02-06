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

import type { RateLimitPluginDefinitionInput } from '../schema/plugin-definition.js';

import { createRateLimitPluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function RateLimitDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const rateLimitPluginDefinitionSchema = useDefinitionSchema(
    createRateLimitPluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as RateLimitPluginDefinitionInput;
    }

    return {
      rateLimitOptions: {},
    } satisfies RateLimitPluginDefinitionInput;
  }, [pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(rateLimitPluginDefinitionSchema),
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
                    Rate Limiting Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Rate limiting uses a Prisma model for storage. Create a
                    model named <code>RateLimiterFlexible</code> with the
                    following fields.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="ratelimit:space-y-6">
                  <div className="ratelimit:rounded-md ratelimit:bg-muted ratelimit:p-4">
                    <pre className="ratelimit:text-sm ratelimit:text-muted-foreground">
                      {`model RateLimiterFlexible {
  key     String   @id
  points  Int
  expire  DateTime?
}`}
                    </pre>
                  </div>
                  <p className="ratelimit:text-sm ratelimit:text-muted-foreground">
                    After adding this model to your data model in the project
                    builder, the rate limiting service will be available for use
                    in your application.
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
