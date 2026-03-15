import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import {
  applyMergedDefinition,
  authModelsSpec,
  diffDefinition,
  featureEntityType,
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
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';

import type { StripePluginDefinitionInput } from '../schema/plugin-definition.js';

import { createBillingPartialDefinition } from '../schema/models.js';
import { createStripePluginDefinitionSchema } from '../schema/plugin-definition.js';
import { PlanEditorForm } from './plan-editor-form.js';

import '#src/styles.css';

/** Form values type exported for child components. */
export type StripeBillingFormValues = StripePluginDefinitionInput;

function resolveFeatureName(
  definition: Parameters<typeof FeatureUtils.getFeaturePathById>[0],
  featureRef: string | null | undefined,
): string {
  if (!featureRef) {
    return '';
  }
  if (featureEntityType.isId(featureRef)) {
    return FeatureUtils.getFeaturePathById(definition, featureRef);
  }
  return featureRef;
}

export function StripeDefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.JSX.Element {
  const { definition, definitionContainer, saveDefinitionWithFeedback } =
    useProjectDefinition();

  const stripePluginDefinitionSchema = useDefinitionSchema(
    createStripePluginDefinitionSchema,
  );

  const defaultValues = useMemo(() => {
    if (pluginMetadata?.config) {
      return pluginMetadata.config as StripePluginDefinitionInput;
    }

    return {
      stripeOptions: {},
      billing: {
        enabled: false,
        featureRef: FeatureUtils.getFeatureIdByNameOrDefault(
          definition,
          'billing',
        ),
        plans: [],
      },
    } satisfies StripePluginDefinitionInput;
  }, [definition, pluginMetadata?.config]);

  const form = useResettableForm({
    resolver: zodResolver(stripePluginDefinitionSchema),
    defaultValues,
  });
  const { control, reset, handleSubmit } = form;

  const billingEnabled = useWatch({ control, name: 'billing.enabled' });
  const billingFeatureRef = useWatch({
    control,
    name: 'billing.featureRef',
  });

  const authModels = definitionContainer.pluginStore.use(authModelsSpec);
  const userModelName = authModels.getAuthModelsOrThrow(definition).user;

  const billingFeatureName = resolveFeatureName(definition, billingFeatureRef);

  const partialDef = useMemo(
    () => createBillingPartialDefinition(billingFeatureName, userModelName),
    [billingFeatureName, userModelName],
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
        const billingData = { ...data };

        if (billingData.billing.enabled && billingData.billing.featureRef) {
          const featureRef = FeatureUtils.ensureFeatureByNameRecursively(
            draftConfig,
            billingData.billing.featureRef,
          );
          const featureName = resolveFeatureName(draftConfig, featureRef);
          const updatedPartialDef = createBillingPartialDefinition(
            featureName,
            userModelName,
          );
          applyMergedDefinition(
            definitionContainer,
            updatedPartialDef,
          )(draftConfig);
          billingData.billing = {
            ...billingData.billing,
            featureRef,
          };
        } else {
          billingData.billing = {
            enabled: false,
            plans: [],
          };
        }

        PluginUtils.setPluginConfig(
          draftConfig,
          metadata,
          billingData,
          definitionContainer,
        );
      },
      {
        successMessage: pluginMetadata
          ? 'Successfully saved Stripe configuration!'
          : 'Successfully enabled Stripe plugin!',
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
                    your backend application. Configure the{' '}
                    <code>STRIPE_SECRET_KEY</code> environment variable in your
                    project to activate Stripe integration.
                  </SectionListSectionDescription>
                </SectionListSectionHeader>
                <SectionListSectionContent className="payments:space-y-6">
                  <SwitchFieldController
                    label="Enable Billing"
                    name="billing.enabled"
                    control={control}
                    description="When enabled, generates billing models, webhook handler, and subscription management code."
                  />
                </SectionListSectionContent>
              </SectionListSection>

              {billingEnabled && (
                <>
                  <SectionListSection>
                    <SectionListSectionHeader>
                      <SectionListSectionTitle>
                        Billing Configuration
                      </SectionListSectionTitle>
                      <SectionListSectionDescription>
                        Configure the feature path and review the models that
                        will be created for billing.
                      </SectionListSectionDescription>
                    </SectionListSectionHeader>
                    <SectionListSectionContent className="payments:space-y-6">
                      <DefinitionDiffAlert
                        diff={diff}
                        upToDateMessage="All required billing models are already configured correctly."
                      />
                      <FeatureComboboxFieldController
                        label="Billing Feature Path"
                        name="billing.featureRef"
                        control={control}
                        canCreate
                        description="Feature path where billing module code will be generated"
                      />
                    </SectionListSectionContent>
                  </SectionListSection>

                  <PlanEditorForm control={control} />
                </>
              )}
            </SectionList>
          </div>

          <FormActionBar
            form={form}
            allowSaveWithoutDirty={!pluginMetadata || diff.hasChanges}
          />
        </form>
      </div>
    </div>
  );
}
