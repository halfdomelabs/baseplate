import type {
  AdminCrudEmbeddedInputConfig,
  AdminCrudEmbeddedLocalInputConfig,
  AdminCrudEnumInputConfig,
  AdminCrudForeignInputConfig,
  AdminCrudInputCompiler,
  AdminCrudPasswordInputConfig,
  AdminCrudTextInputConfig,
  ModelScalarFieldConfig,
} from '@baseplate-dev/project-builder-lib';

import {
  adminCrudInputCompilerSpec,
  createPluginModule,
  EnumUtils,
  ModelFieldUtils,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudEmbeddedInputGenerator,
  adminCrudEnumInputGenerator,
  adminCrudForeignInputGenerator,
  adminCrudPasswordInputGenerator,
  adminCrudTextInputGenerator,
} from '@baseplate-dev/react-generators';

const adminEnumInputCompiler: AdminCrudInputCompiler<AdminCrudEnumInputConfig> =
  {
    name: 'enum',
    compileInput: (definition, { order, definitionContainer, model }) => {
      const fieldConfig = model.model.fields.find(
        (f) => f.id === definition.modelFieldRef,
      );
      if (fieldConfig?.type !== 'enum' || !fieldConfig.options.enumRef) {
        throw new Error(
          `Admin enum input ${definition.modelFieldRef} is not an enum`,
        );
      }
      const enumBlock = EnumUtils.byId(
        definitionContainer.definition,
        fieldConfig.options.enumRef,
      );
      if (!enumBlock) {
        throw new Error(
          `Could not find enum type ${fieldConfig.options.enumRef}`,
        );
      }
      const fieldName = definitionContainer.nameFromId(
        definition.modelFieldRef,
      );
      return adminCrudEnumInputGenerator({
        order,
        modelField: fieldName,
        label: definition.label,
        isOptional: fieldConfig.isOptional,
        options: enumBlock.values.map((v) => ({
          label: v.friendlyName,
          value: v.name,
        })),
      });
    },
  };

const adminForeignInputCompiler: AdminCrudInputCompiler<AdminCrudForeignInputConfig> =
  {
    name: 'foreign',
    compileInput: (definition, { order, definitionContainer, model }) => {
      const relation = model.model.relations.find(
        (r) => r.id === definition.localRelationRef,
      );

      if (!relation) {
        throw new Error(
          `Could not find relation ${definition.localRelationRef} in model ${model.name}`,
        );
      }

      if (relation.references.length !== 1) {
        throw new Error(`Only relations with a single reference are supported`);
      }

      const localField = definitionContainer.nameFromId(
        relation.references[0].localRef,
      );

      const localFieldType = model.model.fields.find(
        (f) => f.id === relation.references[0].localRef,
      )?.type;

      if (
        !localFieldType ||
        (localFieldType !== 'string' && localFieldType !== 'uuid')
      ) {
        throw new Error(
          `Only string and uuid primary keys are supported for foreign inputs`,
        );
      }

      return adminCrudForeignInputGenerator({
        order,
        label: definition.label,
        localRelationName: relation.name,
        isOptional: ModelFieldUtils.isRelationOptional(model, relation),
        localField,
        foreignModelName: definitionContainer.nameFromId(relation.modelRef),
        labelExpression: definition.labelExpression,
        valueExpression: definition.valueExpression,
        valueType: localFieldType,
        defaultLabel: definition.defaultLabel,
        nullLabel: definition.nullLabel,
      });
    },
  };

function getInputType(
  fieldConfig: ModelScalarFieldConfig,
): 'text' | 'checked' | 'date' | 'dateTime' {
  switch (fieldConfig.type) {
    case 'boolean': {
      return 'checked';
    }
    case 'date': {
      return 'date';
    }
    case 'dateTime': {
      return 'dateTime';
    }
    default: {
      return 'text';
    }
  }
}

function getIsNumber(fieldConfig: ModelScalarFieldConfig): boolean {
  return fieldConfig.type === 'int' || fieldConfig.type === 'float';
}

const adminCrudTextInputCompiler: AdminCrudInputCompiler<AdminCrudTextInputConfig> =
  {
    name: 'text',
    compileInput: (definition, { order, definitionContainer, model }) => {
      const fieldConfig = model.model.fields.find(
        (f) => f.id === definition.modelFieldRef,
      );
      if (!fieldConfig) {
        throw new Error(
          `Field ${definition.modelFieldRef} cannot be found in ${model.name}`,
        );
      }
      const fieldName = definitionContainer.nameFromId(
        definition.modelFieldRef,
      );
      return adminCrudTextInputGenerator({
        order,
        label: definition.label,
        modelField: fieldName,
        type: getInputType(fieldConfig),
        validation: definition.validation
          ? definition.validation
          : ModelFieldUtils.getModelFieldValidation(
              definitionContainer.definition,
              model.id,
              fieldConfig.id,
              true,
            ),
        isNumber: getIsNumber(fieldConfig),
      });
    },
  };

const adminCrudEmbeddedInputCompiler: AdminCrudInputCompiler<AdminCrudEmbeddedInputConfig> =
  {
    name: 'embedded',
    compileInput: (definition, { order, definitionContainer, model }) => {
      const relationName = definitionContainer.nameFromId(
        definition.modelRelationRef,
      );
      const relation = ModelUtils.getRelationsToModel(
        definitionContainer.definition,
        model.id,
      ).find((r) => r.relation.foreignId === definition.modelRelationRef);
      if (!relation) {
        throw new Error(
          `Could not find relation ${definition.modelRelationRef} in model ${model.name}`,
        );
      }
      const idFields = ModelUtils.getPrimaryKeyFields(relation.model).map((f) =>
        definitionContainer.nameFromId(f.id),
      );

      return adminCrudEmbeddedInputGenerator({
        order,
        id: definition.modelRelationRef,
        idFields,
        label: definition.label,
        modelRelation: relationName,
        embeddedFormRef: definition.embeddedFormRef,
      });
    },
  };

const adminCrudEmbeddedLocalInputCompiler: AdminCrudInputCompiler<AdminCrudEmbeddedLocalInputConfig> =
  {
    name: 'embeddedLocal',
    compileInput(definition, { order, definitionContainer, model }) {
      const localRelation = ModelFieldUtils.relationByIdOrThrow(
        model,
        definition.localRelationRef,
      );

      const foreignModel = ModelUtils.byIdOrThrow(
        definitionContainer.definition,
        localRelation.modelRef,
      );
      const idFields = ModelUtils.getPrimaryKeyFields(foreignModel).map((f) =>
        definitionContainer.nameFromId(f.id),
      );

      const localRelationName = definitionContainer.nameFromId(
        definition.localRelationRef,
      );

      return adminCrudEmbeddedInputGenerator({
        order,
        id: definition.localRelationRef,
        idFields,
        label: definition.label,
        modelRelation: localRelationName,
        isRequired: !ModelFieldUtils.isRelationOptional(model, localRelation),
        embeddedFormRef: definition.embeddedFormRef,
      });
    },
  };

const adminCrudPasswordInputCompiler: AdminCrudInputCompiler<AdminCrudPasswordInputConfig> =
  {
    name: 'password',
    compileInput: (definition, { order }) =>
      adminCrudPasswordInputGenerator({
        order,
        label: definition.label,
      }),
  };

export const adminCrudInputCoreModule = createPluginModule({
  name: 'admin-crud-input-compiler',
  dependencies: {
    adminCrudInputCompiler: adminCrudInputCompilerSpec,
  },
  initialize: ({ adminCrudInputCompiler }) => {
    adminCrudInputCompiler.inputs.addMany([
      adminEnumInputCompiler,
      adminForeignInputCompiler,
      adminCrudTextInputCompiler,
      adminCrudEmbeddedInputCompiler,
      adminCrudEmbeddedLocalInputCompiler,
      adminCrudPasswordInputCompiler,
    ]);
  },
});
