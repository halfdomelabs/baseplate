import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  MultiCheckboxField,
  SectionList,
  SwitchField,
} from '@halfdomelabs/ui-components';
import { Control, useWatch } from 'react-hook-form';

interface GraphQLQueriesSectionProps {
  className?: string;
  control: Control<ModelConfig>;
}

export function GraphQLQueriesSection({
  className,
  control,
}: GraphQLQueriesSectionProps): JSX.Element {
  const { definition } = useProjectDefinition();

  const isAuthEnabled = !!definition.auth;

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  const roleOptions =
    definition.auth?.roles.map((role) => ({
      label: role.name,
      value: role.id,
    })) ?? [];

  const isGetEnabled = useWatch({
    control,
    name: 'graphql.queries.get.enabled',
  });

  const isListEnabled = useWatch({
    control,
    name: 'graphql.queries.list.enabled',
  });

  return (
    <SectionList.Section className={className}>
      <SectionList.SectionHeader>
        <div className="sticky top-2">
          <SectionList.SectionTitle>Queries</SectionList.SectionTitle>
          <SectionList.SectionDescription>
            Configure the GraphQL queries that can be performed on this model.
          </SectionList.SectionDescription>
        </div>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-6">
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.queries.get.enabled"
            label="Get By ID Query"
            disabled={!isObjectTypeEnabled}
            description="Expose method for querying a single instance of this model by its ID, e.g. user(id: $id)."
          />
          {isGetEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.queries.get.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="max-w-md"
            />
          )}
        </div>
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.queries.list.enabled"
            disabled={!isObjectTypeEnabled}
            label="List Query"
            description="Expose method for querying a list of instances of this model, e.g. users."
          />
          {isListEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.queries.list.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="max-w-md"
            />
          )}
        </div>
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
