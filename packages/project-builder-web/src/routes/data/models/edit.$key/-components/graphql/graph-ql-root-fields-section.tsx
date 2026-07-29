import type { ModelConfigInput } from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  InputFieldController,
  Label,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  SwitchFieldController,
} from '@baseplate-dev/ui-components';
import { useWatch } from 'react-hook-form';
import { MdInfo, MdSettings, MdWarning } from 'react-icons/md';

interface GraphQLRootFieldsSectionProps {
  control: Control<ModelConfigInput>;
}

/**
 * Parses an optional numeric input. `valueAsNumber` yields NaN for an empty
 * field, which would fail validation instead of clearing the limit.
 */
function toOptionalNumber(value: unknown): number | undefined {
  return value === '' || value === null || value === undefined
    ? undefined
    : Number(value);
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
      <SectionListSectionContent className="space-y-4">
        {!isObjectTypeEnabled && (
          <Alert className="max-w-lg">
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
              description="Offset pagination, e.g. posts(skip: 10, take: 5)"
            />
            <div className="flex items-start gap-1">
              <ToggleItem
                control={control}
                name="graphql.queries.connection.enabled"
                disabled={!isObjectTypeEnabled}
                label="Connection"
                description="Cursor pagination, e.g. postsConnection(first, after)"
              />
              <ListQuerySettingsDialog
                control={control}
                disabled={!isObjectTypeEnabled}
              />
            </div>
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

function ListQuerySettingsDialog({
  control,
  disabled,
}: {
  control: Control<ModelConfigInput>;
  disabled: boolean;
}): React.JSX.Element {
  const isListEnabled = useWatch({
    control,
    name: 'graphql.queries.list.enabled',
  });
  const isConnectionEnabled = useWatch({
    control,
    name: 'graphql.queries.connection.enabled',
  });
  const isWhereFilteringEnabled = useWatch({
    control,
    name: 'graphql.queries.where.enabled',
  });
  const isOrderByEnabled = useWatch({
    control,
    name: 'graphql.queries.orderBy.enabled',
  });
  // where/orderBy and the page-size limits apply to both pagination surfaces,
  // so either one alone is enough to make them configurable.
  const hasListSurface =
    (isListEnabled ?? false) || (isConnectionEnabled ?? false);
  // The field lists themselves live in the Sorting & Filtering section since
  // relations share them; the dialog only needs to know whether they are empty
  // so it can warn next to the switch that requires them.
  const hasSortableFields =
    (useWatch({ control, name: 'graphql.orderBy.fields' }) ?? []).length > 0;
  const hasFilterableFields =
    (useWatch({ control, name: 'graphql.where.fields' }) ?? []).length > 0;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            title="Configure list query"
          />
        }
      >
        <MdSettings />
      </DialogTrigger>
      <DialogContent width="lg">
        <DialogHeader>
          <DialogTitle>Configure Queries</DialogTitle>
          <DialogDescription>
            Enable additional query capabilities and set page-size limits. These
            apply to both the list and connection queries.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ToggleItem
            control={control}
            name="graphql.queries.list.count.enabled"
            disabled={!isListEnabled}
            label="Count"
            description="Count matching records, e.g. postsCount(...)"
          />
          <ToggleItem
            control={control}
            name="graphql.queries.where.enabled"
            disabled={!hasListSurface}
            label="Where Filtering"
            description="Filter records by field values, e.g. posts(where: { title: { contains: ... } })"
          />
          {isWhereFilteringEnabled && !hasFilterableFields && (
            <Alert variant="warning">
              <MdWarning />
              <AlertTitle>No filterable fields selected</AlertTitle>
              <AlertDescription>
                Choose filterable fields in the Sorting &amp; Filtering section
                — sync will otherwise fail.
              </AlertDescription>
            </Alert>
          )}
          <ToggleItem
            control={control}
            name="graphql.queries.orderBy.enabled"
            disabled={!hasListSurface}
            label="Order By"
            description="Sort records by field values, e.g. posts(orderBy: [{ createdAt: DESC }])"
          />
          {isOrderByEnabled && !hasSortableFields && (
            <Alert variant="warning">
              <MdWarning />
              <AlertTitle>No sortable fields selected</AlertTitle>
              <AlertDescription>
                Choose sortable fields in the Sorting &amp; Filtering section —
                sync will otherwise fail.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-1">
            <Label>Page Size</Label>
            <p className="text-xs text-muted-foreground">
              Limits how many records a single page may return, so large objects
              aren&apos;t fetched en masse. Leave blank for no limit.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <InputFieldController
                control={control}
                name="graphql.pagination.defaultPageSize"
                disabled={!hasListSurface}
                label="Default"
                type="number"
                min={1}
                placeholder="Unlimited"
                registerOptions={{ setValueAs: toOptionalNumber }}
                description="Applied when the caller requests no size"
              />
              <InputFieldController
                control={control}
                name="graphql.pagination.maxPageSize"
                disabled={!hasListSurface}
                label="Maximum"
                type="number"
                min={1}
                placeholder="Unlimited"
                registerOptions={{ setValueAs: toOptionalNumber }}
                description="Largest page a caller may request"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    | 'graphql.queries.connection.enabled'
    | 'graphql.queries.where.enabled'
    | 'graphql.queries.orderBy.enabled'
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
