import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  MultiCheckboxField,
  SectionList,
  SwitchField,
} from '@halfdomelabs/ui-components';
import { Control, useWatch } from 'react-hook-form';

interface GraphQLMutationsSectionProps {
  className?: string;
  control: Control<ModelConfig>;
}

export function GraphQLMutationsSection({
  className,
  control,
}: GraphQLMutationsSectionProps): JSX.Element {
  const { definition } = useProjectDefinition();

  const isAuthEnabled = !!definition.auth;

  const roleOptions =
    definition.auth?.roles.map((role) => ({
      label: role.name,
      value: role.id,
    })) ?? [];

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  const isCreateEnabled = useWatch({
    control,
    name: 'graphql.mutations.create.enabled',
  });
  const isUpdateEnabled = useWatch({
    control,
    name: 'graphql.mutations.update.enabled',
  });
  const isDeleteEnabled = useWatch({
    control,
    name: 'graphql.mutations.delete.enabled',
  });

  return (
    <SectionList.Section className={className}>
      <SectionList.SectionHeader>
        <div className="sticky top-2">
          <SectionList.SectionTitle>Mutations</SectionList.SectionTitle>
          <SectionList.SectionDescription>
            Configure the GraphQL mutations that can be performed on this model.
          </SectionList.SectionDescription>
        </div>
      </SectionList.SectionHeader>
      <SectionList.SectionContent className="space-y-6">
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.mutations.create.enabled"
            disabled={!isObjectTypeEnabled}
            label="Create Mutation"
            description="Expose the create method in the GraphQL schema, e.g. createUser(input: $input)."
          />
          {isCreateEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.mutations.create.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="max-w-md"
            />
          )}
        </div>
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.mutations.update.enabled"
            label="Update Mutation"
            disabled={!isObjectTypeEnabled}
            description="Expose the update method in the GraphQL schema, e.g. updateUser(id: $id, input: $input)."
          />
          {isUpdateEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.mutations.update.roles"
              label="Allowed Roles"
              options={roleOptions}
              className="max-w-md"
            />
          )}
        </div>
        <div className="space-y-2">
          <SwitchField.Controller
            control={control}
            name="graphql.mutations.delete.enabled"
            label="Delete Mutation"
            disabled={!isObjectTypeEnabled}
            description="Expose the delete method in the GraphQL schema, e.g. deleteUser(id: $id)."
          />
          {isDeleteEnabled && isAuthEnabled && (
            <MultiCheckboxField.Controller
              control={control}
              name="graphql.mutations.delete.roles"
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
