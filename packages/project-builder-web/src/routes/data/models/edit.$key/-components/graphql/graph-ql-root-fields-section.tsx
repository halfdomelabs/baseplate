import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Label,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';
import { MdInfo } from 'react-icons/md';

interface GraphQLRootFieldsSectionProps {
  control: Control<ModelConfigInput>;
}

export function GraphQLRootFieldsSection({
  control,
}: GraphQLRootFieldsSectionProps): React.JSX.Element {
  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  const controllerConfig = useWatch({ control, name: 'service' }) ?? {};
  const isCreateControllerEnabled = controllerConfig.create?.enabled;
  const isUpdateControllerEnabled = controllerConfig.update?.enabled;
  const isDeleteControllerEnabled = controllerConfig.delete?.enabled;

  const hasAnyMutation =
    (isCreateControllerEnabled ?? false) ||
    (isUpdateControllerEnabled ?? false) ||
    (isDeleteControllerEnabled ?? false);

  return (
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>Root Fields</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure which GraphQL queries and mutations are exposed for this
            model.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent>
        {!isObjectTypeEnabled && (
          <Alert className="max-w-md">
            <MdInfo />
            <AlertTitle>Object type missing</AlertTitle>
            <AlertDescription>
              Enable the object type to expose queries and mutations
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <Label>Queries</Label>
            <ToggleItem
              control={control}
              name="graphql.queries.get.enabled"
              disabled={!isObjectTypeEnabled}
              label="Get By ID"
              description="Fetch a single record, e.g. post(id: ID!)"
            />
            <ToggleItem
              control={control}
              name="graphql.queries.list.enabled"
              disabled={!isObjectTypeEnabled}
              label="List"
              description="Query multiple records, e.g. posts(where: ...)"
            />
            <ToggleItem
              control={control}
              name="graphql.queries.list.count.enabled"
              disabled={!isObjectTypeEnabled}
              label="Count"
              description="Count matching records, e.g. postsCount(...)"
            />
          </div>
          {hasAnyMutation && (
            <div className="space-y-4">
              <Label>Mutations</Label>
              {isCreateControllerEnabled && (
                <ToggleItem
                  control={control}
                  name="graphql.mutations.create.enabled"
                  disabled={!isObjectTypeEnabled}
                  label="Create"
                  description="Add a new record, e.g. createPost(...)"
                />
              )}
              {isUpdateControllerEnabled && (
                <ToggleItem
                  control={control}
                  name="graphql.mutations.update.enabled"
                  disabled={!isObjectTypeEnabled}
                  label="Update"
                  description="Modify an existing record, e.g. updatePost(...)"
                />
              )}
              {isDeleteControllerEnabled && (
                <ToggleItem
                  control={control}
                  name="graphql.mutations.delete.enabled"
                  disabled={!isObjectTypeEnabled}
                  label="Delete"
                  description="Remove a record, e.g. deletePost(...)"
                />
              )}
            </div>
          )}
        </div>
      </SectionListSectionContent>
    </SectionListSection>
  );
}

function ToggleItem({
  control,
  name,
  disabled,
  label,
  description,
}: {
  control: Control<ModelConfigInput>;
  name:
    | 'graphql.queries.get.enabled'
    | 'graphql.queries.list.enabled'
    | 'graphql.queries.list.count.enabled'
    | 'graphql.mutations.create.enabled'
    | 'graphql.mutations.update.enabled'
    | 'graphql.mutations.delete.enabled';
  disabled: boolean;
  label: string;
  description: string;
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <SwitchFieldController
        control={control}
        name={name}
        disabled={disabled}
        label={label}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
