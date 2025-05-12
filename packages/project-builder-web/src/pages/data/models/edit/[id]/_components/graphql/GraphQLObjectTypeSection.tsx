import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { Control } from 'react-hook-form';

import { ModelUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import {
  Badge,
  Button,
  Label,
  SectionList,
  Switch,
  SwitchField,
} from '@halfdomelabs/ui-components';
import { useState } from 'react';
import { useController, useWatch } from 'react-hook-form';
import { HiMiniChevronDown, HiMiniChevronUp } from 'react-icons/hi2';

import { SCALAR_FIELD_TYPE_OPTIONS } from '../../../../_constants';
import { useEditedModelConfig } from '../../../../_hooks/useEditedModelConfig';
import { BadgeWithTypeLabel } from '../BadgeWithTypeLabel';

interface GraphQLObjectTypeSectionProps {
  control: Control<ModelConfig>;
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
    <SectionList.Section>
      <div>
        <SectionList.SectionHeader className="sticky top-2">
          <SectionList.SectionTitle>Object Type</SectionList.SectionTitle>
          <SectionList.SectionDescription>
            Configure the object type that will be exposed in the GraphQL schema
            for this model.
          </SectionList.SectionDescription>
        </SectionList.SectionHeader>
      </div>
      <SectionList.SectionContent className="space-y-4">
        <SwitchField.Controller
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
                    className="text-muted-foreground mr-5 font-medium"
                  >
                    {fieldsValue.length}/{fields.length} active
                  </Badge>
                  {showCollapsibleFields ? (
                    <Button.WithOnlyIcon
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
                      icon={
                        shouldCollapseFields
                          ? HiMiniChevronDown
                          : HiMiniChevronUp
                      }
                    />
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
                      className="text-muted-foreground mr-5 font-medium"
                    >
                      {localRelationsValue.length}/{localRelations.length}{' '}
                      active
                    </Badge>
                    {showCollapsibleLocalRelations ? (
                      <Button.WithOnlyIcon
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
                        icon={
                          shouldCollapseLocalRelations
                            ? HiMiniChevronDown
                            : HiMiniChevronUp
                        }
                      />
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
                      className="text-muted-foreground mr-5 font-medium"
                    >
                      {foreignRelationsValue.length}/{foreignRelations.length}{' '}
                      active
                    </Badge>
                    {showCollapsibleForeignRelations ? (
                      <Button.WithOnlyIcon
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
                        icon={
                          shouldCollapseForeignRelations
                            ? HiMiniChevronDown
                            : HiMiniChevronUp
                        }
                      />
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
      </SectionList.SectionContent>
    </SectionList.Section>
  );
}
