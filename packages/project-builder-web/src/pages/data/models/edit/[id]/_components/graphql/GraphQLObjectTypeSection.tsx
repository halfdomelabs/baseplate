import type { ModelConfigInput } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { ModelUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Badge,
  Button,
  Label,
  SectionListSection,
  SectionListSectionContent,
  SectionListSectionDescription,
  SectionListSectionHeader,
  SectionListSectionTitle,
  Switch,
  SwitchFieldController,
} from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { HiMiniChevronDown, HiMiniChevronUp } from 'react-icons/hi2';

import { SCALAR_FIELD_TYPE_OPTIONS } from '../../../../_constants.js';
import { useEditedModelConfig } from '../../../../_hooks/useEditedModelConfig.js';
import { BadgeWithTypeLabel } from '../BadgeWithTypeLabel.js';

interface GraphQLObjectTypeSectionProps {
  control: Control<ModelConfigInput>;
}

const tableClassName =
  'border-collapse text-left [&_td]:py-1 [&_th]:sticky [&_th]:top-0 [&_th]:bg-background [&_th]:z-10 [&_th]:py-2';

function getUpdatedOrderedList(
  items: { id: string }[],
  selected: string[],
  checked: boolean,
  id: string,
): string[] {
  return checked
    ? items
        .filter((f) => selected.includes(f.id) || f.id === id)
        .map((f) => f.id)
    : selected.filter((f) => f !== id);
}

export function GraphQLObjectTypeSection({
  control,
}: GraphQLObjectTypeSectionProps): React.JSX.Element {
  const { definitionContainer, definition } = useProjectDefinition();
  const modelId = useEditedModelConfig((model) => model.id);

  const isObjectTypeEnabled = useWatch({
    control,
    name: 'graphql.objectType.enabled',
  });

  const fields = useEditedModelConfig((model) => model.model.fields);
  const {
    field: { value: fieldsValue = [], onChange: fieldsOnChange },
  } = useController({
    control,
    name: 'graphql.objectType.fields',
  });
  const showCollapsibleFields = fields.length > 10;
  const [shouldCollapseFields, setShouldCollapseFields] = useState(
    showCollapsibleFields,
  );

  const localRelations =
    useEditedModelConfig((model) => model.model.relations) ?? [];
  const {
    field: {
      value: localRelationsValue = [],
      onChange: localRelationsOnChange,
    },
  } = useController({
    control,
    name: 'graphql.objectType.localRelations',
  });
  const showCollapsibleLocalRelations = localRelations.length > 4;
  const [shouldCollapseLocalRelations, setShouldCollapseLocalRelations] =
    useState(showCollapsibleLocalRelations);

  const foreignRelations = ModelUtils.getRelationsToModel(definition, modelId);
  const {
    field: {
      value: foreignRelationsValue = [],
      onChange: foreignRelationsOnChange,
    },
  } = useController({
    control,
    name: 'graphql.objectType.foreignRelations',
  });
  const showCollapsibleForeignRelations = foreignRelations.length > 4;
  const [shouldCollapseForeignRelations, setShouldCollapseForeignRelations] =
    useState(showCollapsibleForeignRelations);

  return (
    <SectionListSection>
      <div>
        <SectionListSectionHeader className="sticky top-2">
          <SectionListSectionTitle>Object Type</SectionListSectionTitle>
          <SectionListSectionDescription>
            Configure the object type that will be exposed in the GraphQL schema
            for this model.
          </SectionListSectionDescription>
        </SectionListSectionHeader>
      </div>
      <SectionListSectionContent className="space-y-4">
        <SwitchFieldController
          control={control}
          name="graphql.objectType.enabled"
          label="Enable Object Type"
          description="Must be enabled for queries, mutations, and any relations to this model"
        />
        <table className={tableClassName}>
          <thead>
            <tr>
              <th>
                <div className="flex w-80 items-center gap-1">
                  <Label>Exposed Fields</Label>
                  <Badge
                    variant="outline"
                    className="mr-5 font-medium text-muted-foreground"
                  >
                    {fieldsValue.length}/{fields.length} active
                  </Badge>
                  {showCollapsibleFields ? (
                    <Button
                      onClick={() => {
                        setShouldCollapseFields(!shouldCollapseFields);
                      }}
                      className="flex items-center gap-4"
                      title={
                        shouldCollapseFields
                          ? 'Expand fields'
                          : 'Collapse fields'
                      }
                      type="button"
                      variant="ghost"
                      size="icon"
                    >
                      {shouldCollapseFields ? (
                        <HiMiniChevronDown />
                      ) : (
                        <HiMiniChevronUp />
                      )}
                    </Button>
                  ) : null}
                </div>
              </th>
              <th className="pl-8"></th>
            </tr>
          </thead>
          <tbody>
            {/* Fields */}
            {!shouldCollapseFields &&
              fields.map((field) => (
                <tr key={field.id}>
                  <td>
                    <BadgeWithTypeLabel
                      type={
                        field.type === 'enum' && field.options?.enumRef
                          ? definitionContainer.nameFromId(
                              field.options.enumRef,
                            )
                          : SCALAR_FIELD_TYPE_OPTIONS[field.type].label
                      }
                    >
                      {field.name}
                    </BadgeWithTypeLabel>
                  </td>
                  <td className="pl-8">
                    <Switch
                      aria-label={`Expose ${field.name} field`}
                      disabled={!isObjectTypeEnabled}
                      checked={fieldsValue.includes(field.id)}
                      onCheckedChange={(checked) => {
                        fieldsOnChange(
                          getUpdatedOrderedList(
                            fields,
                            fieldsValue,
                            checked,
                            field.id,
                          ),
                        );
                      }}
                    />
                  </td>
                </tr>
              ))}
            {/* Local Relations */}
            {localRelations.length > 0 ? (
              <tr>
                <th>
                  <div className="flex items-center gap-1">
                    <Label>Exposed Local Relations</Label>
                    <Badge
                      variant="outline"
                      className="mr-5 font-medium text-muted-foreground"
                    >
                      {localRelationsValue.length}/{localRelations.length}{' '}
                      active
                    </Badge>
                    {showCollapsibleLocalRelations ? (
                      <Button
                        onClick={() => {
                          setShouldCollapseLocalRelations(
                            !shouldCollapseLocalRelations,
                          );
                        }}
                        className="flex items-center gap-4"
                        title={
                          shouldCollapseLocalRelations
                            ? 'Expand fields'
                            : 'Collapse fields'
                        }
                        type="button"
                        variant="ghost"
                        size="icon"
                      >
                        {shouldCollapseLocalRelations ? (
                          <HiMiniChevronDown />
                        ) : (
                          <HiMiniChevronUp />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </th>
                <th></th>
              </tr>
            ) : null}
            {!shouldCollapseLocalRelations &&
              localRelations.map((relation) => (
                <tr key={relation.id}>
                  <td>
                    <BadgeWithTypeLabel
                      type={definitionContainer.nameFromId(relation.modelRef)}
                    >
                      {relation.name}
                    </BadgeWithTypeLabel>
                  </td>
                  <td className="pl-8">
                    <Switch
                      aria-label={`Expose ${relation.name} relation`}
                      disabled={!isObjectTypeEnabled}
                      checked={localRelationsValue.includes(relation.id)}
                      onCheckedChange={(checked) => {
                        localRelationsOnChange(
                          getUpdatedOrderedList(
                            localRelations,
                            localRelationsValue,
                            checked,
                            relation.id,
                          ),
                        );
                      }}
                    />
                  </td>
                </tr>
              ))}
            {/* Foreign Relations */}
            {foreignRelations.length > 0 ? (
              <tr>
                <th>
                  <div className="flex items-center gap-1">
                    <Label>Exposed Foreign Relations</Label>
                    <Badge
                      variant="outline"
                      className="mr-5 font-medium text-muted-foreground"
                    >
                      {foreignRelationsValue.length}/{foreignRelations.length}{' '}
                      active
                    </Badge>
                    {showCollapsibleForeignRelations ? (
                      <Button
                        onClick={() => {
                          setShouldCollapseForeignRelations(
                            !shouldCollapseForeignRelations,
                          );
                        }}
                        className="flex items-center gap-4"
                        title={
                          shouldCollapseForeignRelations
                            ? 'Expand fields'
                            : 'Collapse fields'
                        }
                        type="button"
                        variant="ghost"
                        size="icon"
                      >
                        {shouldCollapseForeignRelations ? (
                          <HiMiniChevronDown />
                        ) : (
                          <HiMiniChevronUp />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </th>
                <th></th>
              </tr>
            ) : null}
            {!shouldCollapseForeignRelations &&
              foreignRelations.map(({ model, relation }) => (
                <tr key={relation.id}>
                  <td>
                    <BadgeWithTypeLabel type={model.name}>
                      {relation.foreignRelationName}
                    </BadgeWithTypeLabel>
                  </td>
                  <td className="pl-8">
                    <Switch
                      aria-label={`Expose ${relation.foreignRelationName} relation`}
                      disabled={!isObjectTypeEnabled}
                      checked={foreignRelationsValue.includes(
                        relation.foreignId,
                      )}
                      onCheckedChange={(checked) => {
                        foreignRelationsOnChange(
                          getUpdatedOrderedList(
                            foreignRelations.map(({ relation }) => ({
                              id: relation.foreignId,
                            })),
                            foreignRelationsValue,
                            checked,
                            relation.foreignId,
                          ),
                        );
                      }}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </SectionListSectionContent>
    </SectionListSection>
  );
}
