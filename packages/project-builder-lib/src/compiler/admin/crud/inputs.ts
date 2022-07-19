import { AppEntryBuilder } from '@src/compiler/appEntryBuilder';
import {
  AdminAppConfig,
  AdminCrudEnumInputConfig,
  AdminCrudFileInputConfig,
  AdminCrudForeignInputConfig,
  AdminCrudInputConfig,
  AdminCrudTextInputConfig,
} from '@src/schema';

function compileAdminEnumInput(
  field: AdminCrudEnumInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  const model = builder.parsedProject.getModelByName(modelName);
  const fieldConfig = model.model.fields.find(
    (f) => f.name === field.modelField
  );
  if (fieldConfig?.type !== 'enum') {
    throw new Error(`Admin enum input ${field.modelField} is not an enum`);
  }
  const enumBlock = builder.parsedProject
    .getEnums()
    .find((e) => e.name === fieldConfig.options?.enumType);
  if (!enumBlock) {
    throw new Error(
      `Could not find enum type ${fieldConfig.options?.enumType || ''}`
    );
  }
  return {
    name: field.modelField,
    generator: '@baseplate/react/admin/admin-crud-enum-input',
    modelField: field.modelField,
    label: field.label,
    isOptional: fieldConfig.isOptional,
    options: enumBlock.values.map((v) => ({
      label: v.friendlyName,
      value: v.name,
    })),
  };
}

function compileAdminForeignInput(
  field: AdminCrudForeignInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  const model = builder.parsedProject.getModelByName(modelName);
  const relation = model.model.relations?.find(
    (r) => r.name === field.localRelationName
  );

  if (!relation) {
    throw new Error(
      `Could not find relation ${field.localRelationName} in model ${modelName}`
    );
  }

  if (relation.references.length !== 1) {
    throw new Error(`Only relations with a single reference are supported`);
  }

  const localField = relation.references[0].local;

  return {
    name: field.localRelationName,
    generator: '@baseplate/react/admin/admin-crud-foreign-input',
    label: field.label,
    localRelationName: field.localRelationName,
    isOptional: relation.isOptional,
    localField,
    foreignModelName: relation.modelName,
    labelExpression: field.labelExpression,
    valueExpression: field.valueExpression,
    defaultLabel: field.defaultLabel,
  };
}

function compileAdminCrudTextInput(
  field: AdminCrudTextInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  const model = builder.parsedProject.getModelByName(modelName);
  const fieldConfig = model.model.fields.find(
    (f) => f.name === field.modelField
  );
  if (!fieldConfig) {
    throw new Error(`Admin enum input ${field.modelField} cannot be found`);
  }
  return {
    name: field.modelField,
    generator: '@baseplate/react/admin/admin-crud-text-input',
    label: field.label,
    modelField: field.modelField,
    isCheckbox: fieldConfig.type === 'boolean',
    validation:
      field.validation ||
      builder.parsedProject.getModelFieldValidation(
        modelName,
        field.modelField,
        true
      ),
  };
}

function compileAdminCrudFileInput(
  field: AdminCrudFileInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  const model = builder.parsedProject.getModelByName(modelName);
  const relation = model.model.relations?.find(
    (r) => r.name === field.modelRelation
  );

  if (!relation) {
    throw new Error(
      `Could not find relation ${field.modelRelation} in model ${modelName}`
    );
  }

  const category = builder.parsedProject.projectConfig.storage?.categories.find(
    (c) => c.usedByRelation === relation.foreignRelationName
  );

  if (!category) {
    throw new Error(
      `Could not find category for relation ${relation.foreignRelationName}`
    );
  }

  return {
    name: field.modelRelation,
    generator: '@baseplate/react/admin/admin-crud-file-input',
    label: field.label,
    isOptional: relation.isOptional,
    category: category.name,
    modelRelation: field.modelRelation,
  };
}

export function compileAdminCrudInput(
  field: AdminCrudInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  switch (field.type) {
    case 'foreign':
      return compileAdminForeignInput(field, modelName, builder);
    case 'enum':
      return compileAdminEnumInput(field, modelName, builder);
    case 'text':
      return compileAdminCrudTextInput(field, modelName, builder);
    case 'file':
      return compileAdminCrudFileInput(field, modelName, builder);
    default:
      throw new Error(
        `Unknown admin crud input ${(field as { type: string }).type}`
      );
  }
}
