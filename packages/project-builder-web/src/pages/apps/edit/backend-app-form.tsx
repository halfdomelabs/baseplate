import type { BackendAppConfig } from '@baseplate-dev/project-builder-lib';
import type React from 'react';

import { createBackendAppSchema } from '@baseplate-dev/project-builder-lib';
import {
  useBlockUnsavedChangesNavigate,
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
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

import { useDefinitionSchema } from '#src/hooks/use-definition-schema.js';

interface Props {
  className?: string;
  appConfig: BackendAppConfig;
}

function BackendAppForm({ className, appConfig }: Props): React.JSX.Element {
  const { saveDefinitionWithFeedback } = useProjectDefinition();

  const backendAppSchema = useDefinitionSchema(createBackendAppSchema);
  const formProps = useResettableForm({
    resolver: zodResolver(backendAppSchema),
    values: appConfig,
  });
  const { control, handleSubmit, reset } = formProps;

  const onSubmit = handleSubmit((data) =>
    saveDefinitionWithFeedback((draftConfig) => {
      draftConfig.apps = draftConfig.apps.map((app) =>
        app.id === appConfig.id ? data : app,
      );
    }),
  );

  useBlockUnsavedChangesNavigate({ control, reset, onSubmit });

  return (
    <form
      className={clsx('w-full max-w-7xl space-y-4 px-4', className)}
      onSubmit={onSubmit}
    >
      <SectionList>
        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>General</SectionListSectionTitle>
            <SectionListSectionDescription>
              Basic configuration for your backend application.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent className="space-y-6">
            <InputFieldController label="Name" control={control} name="name" />
            <InputFieldController
              label="Package Location (optional)"
              placeholder="e.g. packages/backend"
              control={control}
              name="packageLocation"
            />
          </SectionListSectionContent>
        </SectionListSection>

        <SectionListSection>
          <SectionListSectionHeader>
            <SectionListSectionTitle>Configuration</SectionListSectionTitle>
            <SectionListSectionDescription>
              Enable or disable external services and features for your backend
              application.
            </SectionListSectionDescription>
          </SectionListSectionHeader>
          <SectionListSectionContent>
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
                <div className="flex flex-col">
                  <span className="font-medium">Service</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Enable</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2">
                  <span>Stripe</span>
                  <SwitchFieldController
                    control={control}
                    name="enableStripe"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2">
                  <span>Postmark</span>
                  <SwitchFieldController
                    control={control}
                    name="enablePostmark"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2">
                  <span>Redis</span>
                  <SwitchFieldController control={control} name="enableRedis" />
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2">
                  <span>Bull Queue</span>
                  <SwitchFieldController
                    control={control}
                    name="enableBullQueue"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2">
                  <span>GraphQL Subscriptions</span>
                  <SwitchFieldController
                    control={control}
                    name="enableSubscriptions"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 py-2">
                  <span>Axios</span>
                  <SwitchFieldController control={control} name="enableAxios" />
                </div>
              </div>
            </div>
          </SectionListSectionContent>
        </SectionListSection>
      </SectionList>
      <FormActionBar form={formProps} />
    </form>
  );
}

export default BackendAppForm;
