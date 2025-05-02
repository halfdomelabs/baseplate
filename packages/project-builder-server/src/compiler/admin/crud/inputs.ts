import type {
  AdminAppConfig,
  AdminCrudEmbeddedInputConfig,
  AdminCrudEmbeddedLocalInputConfig,
  AdminCrudEnumInputConfig,
  AdminCrudForeignInputConfig,
  AdminCrudInputCompiler,
  AdminCrudInputDefinition,
  AdminCrudPasswordInputConfig,
  AdminCrudTextInputConfig,
  ModelScalarFieldConfig,
} from '@halfdomelabs/project-builder-lib';

import {
  adminCrudInputCompilerSpec,
  EnumUtils,
  ModelFieldUtils,
  ModelUtils,
} from '@halfdomelabs/project-builder-lib';
import {
  adminCrudEmbeddedInputGenerator,
  adminCrudEnumInputGenerator,
  adminCrudForeignInputGenerator,
  adminCrudPasswordInputGenerator,
  adminCrudTextInputGenerator,
} from '@halfdomelabs/react-generators';
import { type GeneratorBundle, makeIdSafe } from '@halfdomelabs/sync';

import type { AppEntryBuilder } from '@src/compiler/app-entry-builder.js';

const adminEnumInputCompiler: AdminCrudInputCompiler<AdminCrudEnumInputConfig> =
  {
    name: 'enum',
    compileInput: (definition, { order, definitionContainer, model }) => {
      const fieldConfig = model.model.fields.find(
        (f) => f.id === definition.modelFieldRef,
      );
      if (fieldConfig?.type !== 'enum' || !fieldConfig.options?.enumRef) {
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
          `Could not find enum type ${fieldConfig.options.enumRef ?? ''}`,
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
      const relation = model.model.relations?.find(
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

      return adminCrudForeignInputGenerator({
        order,
        label: definition.label,
        localRelationName: relation.name,
        isOptional: ModelFieldUtils.isRelationOptional(model, relation),
        localField,
        foreignModelName: definitionContainer.nameFromId(relation.modelRef),
        labelExpression: definition.labelExpression,
        valueExpression: definition.valueExpression,
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
      });
    },
  };

const adminCrudEmbeddedInputCompiler: AdminCrudInputCompiler<AdminCrudEmbeddedInputConfig> =
  {
    name: 'embedded',
    compileInput: (definition, { order, definitionContainer }) => {
      const relationName = definitionContainer.nameFromId(
        definition.modelRelationRef,
      );
      return adminCrudEmbeddedInputGenerator({
        order,
        // TODO: We should use an actual ID on the input
        id: makeIdSafe(definition.label),
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
      const localRelation = model.model.relations?.find(
        (r) => r.id === definition.localRelationRef,
      );

      if (!localRelation) {
        throw new Error(
          `Could not find relation ${definition.localRelationRef} in model ${model.name}`,
        );
      }

      const localRelationName = definitionContainer.nameFromId(
        definition.localRelationRef,
      );

      return adminCrudEmbeddedInputGenerator({
        order,
        // TODO: We should use an actual ID on the input
        id: makeIdSafe(definition.label),
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
  order: number,
): GeneratorBundle {
  const inputCompiler = builder.pluginStore.getPluginSpec(
    adminCrudInputCompilerSpec,
  );

  const compiler = inputCompiler.getCompiler(field.type, builtInCompilers);

  return compiler.compileInput(field, {
    order,
    definitionContainer: builder.definitionContainer,
    model: ModelUtils.byIdOrThrow(builder.projectDefinition, modelId),
    crudSectionId,
  });
}
