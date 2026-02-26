import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { authConfigSpec } from '@baseplate-dev/project-builder-lib';
import { useProjectDefinition } from '@baseplate-dev/project-builder-lib/web';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  MultiSwitchField,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';
import { MdInfo } from 'react-icons/md';

interface GraphQLQueriesSectionProps {
  control: Control<ModelConfigInput>;
}

export function GraphQLQueriesSection({
  control,
}: GraphQLQueriesSectionProps): React.JSX.Element {
  const { definition, pluginContainer } = useProjectDefinition();

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  const roleOptions = pluginContainer
    .use(authConfigSpec)
    .getAuthConfig(definition)
    ?.roles.map((role) => ({
      label: role.name,
      value: role.id,
    }));

  const isGetEnabled = useWatch({
    control,
    name: 'graphql.queries.get.enabled',
  });

  const isListEnabled = useWatch({
    control,
    name: 'graphql.queries.list.enabled',
  });

  return (
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>Queries</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure the GraphQL queries that can be performed on this model.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent className="space-y-8">
        {!isObjectTypeEnabled && (
          <Alert className="max-w-md">
            <MdInfo />
            <AlertTitle>Object type missing</AlertTitle>
            <AlertDescription>
              Enable the object type to expose queries and mutations
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
          <SwitchFieldController
            control={control}
            name="graphql.queries.get.enabled"
            label="Get By ID Query"
            disabled={!isObjectTypeEnabled}
            description="Expose method for querying a single instance of this model by its ID, e.g. user(id: $id)."
          />
          {isGetEnabled && roleOptions && (
            <MultiSwitchField.Controller
              control={control}
              name="graphql.queries.get.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="ml-[52px]" // hardcoded to align with the above switch label
            />
          )}
        </div>
        <div className="space-y-4">
          <SwitchFieldController
            control={control}
            name="graphql.queries.list.enabled"
            disabled={!isObjectTypeEnabled}
            label="List Query"
            description="Expose method for querying a list of instances of this model, e.g. users."
          />
          {isListEnabled && roleOptions && (
            <MultiSwitchField.Controller
              control={control}
              name="graphql.queries.list.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="ml-[52px]" // hardcoded to align with the above switch label
            />
          )}
          {isListEnabled && (
            <SwitchFieldController
              control={control}
              name="graphql.queries.list.count.enabled"
              label="Count Query"
              description="Generate a count query (e.g. usersCount) for total record count, useful for paginated UIs."
              className="ml-[52px]"
            />
          )}
        </div>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
