import {
  AdminAppConfig,
  AdminCrudEmbeddedInputConfig,
  AdminCrudEmbeddedLocalInputConfig,
  AdminCrudEnumInputConfig,
  AdminCrudForeignInputConfig,
  AdminCrudInputCompiler,
  AdminCrudInputDefinition,
  AdminCrudPasswordInputConfig,
  AdminCrudTextInputConfig,
  EnumUtils,
  ModelFieldUtils,
  ModelScalarFieldConfig,
  ModelUtils,
  adminCrudInputCompilerSpec,
} from '@halfdomelabs/project-builder-lib';

import { AppEntryBuilder } from '@src/compiler/appEntryBuilder.js';

const adminEnumInputCompiler: AdminCrudInputCompiler<AdminCrudEnumInputConfig> =
  {
    name: 'enum',
    compileInput: (definition, { definitionContainer, model }) => {
      const fieldConfig = model.model.fields.find(
        (f) => f.id === definition.modelField,
      );
      if (fieldConfig?.type !== 'enum' || !fieldConfig.options?.enumType) {
        throw new Error(
          `Admin enum input ${definition.modelField} is not an enum`,
        );
      }
      const enumBlock = EnumUtils.byId(
        definitionContainer.definition,
        fieldConfig.options.enumType,
      );
      if (!enumBlock) {
        throw new Error(
          `Could not find enum type ${fieldConfig.options?.enumType ?? ''}`,
        );
      }
      const fieldName = definitionContainer.nameFromId(definition.modelField);
      return {
        name: fieldName,
        generator: '@halfdomelabs/react/admin/admin-crud-enum-input',
        modelField: fieldName,
        label: definition.label,
        isOptional: fieldConfig.isOptional,
        options: enumBlock.values.map((v) => ({
          label: v.friendlyName,
          value: v.name,
        })),
      };
    },
  };

const adminForeignInputCompiler: AdminCrudInputCompiler<AdminCrudForeignInputConfig> =
  {
    name: 'foreign',
    compileInput: (definition, { definitionContainer, model }) => {
      const relation = model.model.relations?.find(
        (r) => r.id === definition.localRelationName,
      );

      if (!relation) {
        throw new Error(
          `Could not find relation ${definition.localRelationName} in model ${model.name}`,
        );
      }

      if (relation.references.length !== 1) {
        throw new Error(`Only relations with a single reference are supported`);
      }

      const localField = definitionContainer.nameFromId(
        relation.references[0].local,
      );

      return {
        name: relation.name,
        generator: '@halfdomelabs/react/admin/admin-crud-foreign-input',
        label: definition.label,
        localRelationName: relation.name,
        isOptional: ModelFieldUtils.isRelationOptional(model, relation),
        localField,
        foreignModelName: definitionContainer.nameFromId(relation.modelName),
        labelExpression: definition.labelExpression,
        valueExpression: definition.valueExpression,
        defaultLabel: definition.defaultLabel,
        nullLabel: definition.nullLabel,
      };
    },
  };

function getInputType(fieldConfig: ModelScalarFieldConfig): string {
  switch (fieldConfig.type) {
    case 'boolean':
      return 'checked';
    case 'date':
      return 'date';
    case 'dateTime':
      return 'dateTime';
    default:
      return 'text';
  }
}

const adminCrudTextInputCompiler: AdminCrudInputCompiler<AdminCrudTextInputConfig> =
  {
    name: 'text',
    compileInput: (definition, { definitionContainer, model }) => {
      const fieldConfig = model.model.fields.find(
        (f) => f.id === definition.modelField,
      );
      if (!fieldConfig) {
        throw new Error(
          `Field ${definition.modelField} cannot be found in ${model.name}`,
        );
      }
      const fieldName = definitionContainer.nameFromId(definition.modelField);
      return {
        name: fieldName,
        generator: '@halfdomelabs/react/admin/admin-crud-text-input',
        label: definition.label,
        modelField: fieldName,
        type: getInputType(fieldConfig),
        validation: !definition.validation
          ? ModelFieldUtils.getModelFieldValidation(
              definitionContainer.definition,
              model.id,
              fieldConfig.id,
              true,
            )
          : definition.validation,
      };
    },
  };

const adminCrudEmbeddedInputCompiler: AdminCrudInputCompiler<AdminCrudEmbeddedInputConfig> =
  {
    name: 'embedded',
    compileInput: (definition, { definitionContainer, crudSectionId }) => {
      const relationName = definitionContainer.nameFromId(
        definition.modelRelation,
      );
      return {
        name: relationName,
        generator: '@halfdomelabs/react/admin/admin-crud-embedded-input',
        label: definition.label,
        modelRelation: relationName,
        embeddedFormRef: `${crudSectionId}.edit.embeddedForms.${definitionContainer.nameFromId(
          definition.embeddedFormName,
        )}`,
      };
    },
  };

const adminCrudEmbeddedLocalInputCompiler: AdminCrudInputCompiler<AdminCrudEmbeddedLocalInputConfig> =
  {
    name: 'embeddedLocal',
    compileInput(definition, { definitionContainer, model, crudSectionId }) {
      const localRelation = model.model.relations?.find(
        (r) => r.id === definition.localRelation,
      );

      if (!localRelation) {
        throw new Error(
          `Could not find relation ${definition.localRelation} in model ${model.name}`,
        );
      }

      const localRelationName = definitionContainer.nameFromId(
        definition.localRelation,
      );

      return {
        name: localRelationName,
        generator: '@halfdomelabs/react/admin/admin-crud-embedded-input',
        label: definition.label,
        modelRelation: localRelationName,
        isRequired: !ModelFieldUtils.isRelationOptional(model, localRelation),
        embeddedFormRef: `${crudSectionId}.edit.embeddedForms.${definitionContainer.nameFromId(
          definition.embeddedFormName,
        )}`,
      };
    },
  };

const adminCrudPasswordInputCompiler: AdminCrudInputCompiler<AdminCrudPasswordInputConfig> =
  {
    name: 'password',
    compileInput: (definition) => {
      return {
        name: 'password',
        generator: '@halfdomelabs/react/admin/admin-crud-password-input',
        label: definition.label,
      };
    },
  };

const builtInCompilers = [
  adminEnumInputCompiler,
  adminForeignInputCompiler,
  adminCrudTextInputCompiler,
  adminCrudEmbeddedInputCompiler,
  adminCrudEmbeddedLocalInputCompiler,
  adminCrudPasswordInputCompiler,
];

export function compileAdminCrudInput(
  field: AdminCrudInputDefinition,
  modelId: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  crudSectionId: string,
): unknown {
  const inputCompiler = builder.pluginStore.getPluginSpec(
    adminCrudInputCompilerSpec,
  );

  const compiler = inputCompiler.getCompiler(field.type, builtInCompilers);

  return compiler.compileInput(field, {
    definitionContainer: builder.definitionContainer,
    model: ModelUtils.byId(builder.projectDefinition, modelId),
    crudSectionId,
  });
}
