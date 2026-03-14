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

import type { StripePluginDefinitionInput } from '../schema/plugin-definition.js';

import { createStripePluginDefinitionSchema } from '../schema/plugin-definition.js';

import '#src/styles.css';

export function StripeDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const stripePluginDefinitionSchema = useDefinitionSchema(
    createStripePluginDefinitionSchema,
  );

  const defaultValues = useMemo(
    () =>
      (pluginMetadata?.config as StripePluginDefinitionInput | undefined) ?? {
        stripeOptions: {},
      },
    [pluginMetadata?.config],
  );

  const form = useResettableForm({
    resolver: zodResolver(stripePluginDefinitionSchema),
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
        successMessage: 'Successfully saved Stripe configuration!',
        onSuccess: () => {
          onSave();
        },
      },
    ),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <div className="payments:relative payments:flex payments:h-full payments:flex-1 payments:flex-col payments:gap-4 payments:overflow-hidden">
      <div
        className="payments:mb-[--action-bar-height] payments:flex payments:flex-1 payments:overflow-y-auto"
        style={
          {
            '--action-bar-height': '52px',
          } as React.CSSProperties
        }
      >
        <form
          onSubmit={onSubmit}
          className="payments:max-w-6xl payments:flex-1"
        >
          <div className="payments:pb-16">
            <SectionList>
              <SectionListSection>
                <SectionListSectionHeader>
                  <SectionListSectionTitle>
                    Stripe Configuration
                  </SectionListSectionTitle>
                  <SectionListSectionDescription>
                    Stripe provides payment processing and webhook handling for
                    your backend application. Once enabled, configure the{' '}
                    <code>STRIPE_SECRET_KEY</code> and{' '}
                    <code>STRIPE_ENDPOINT_SECRET</code> environment variables in
                    your project to activate Stripe integration.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent>
                  <p className="payments:text-sm payments:text-muted-foreground">
                    No additional configuration is required. Save to enable
                    Stripe integration in your project.
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
