import { AppEntryBuilder } from '@src/compiler/appEntryBuilder.js';
import {
  AdminAppConfig,
  AdminCrudEmbeddedInputConfig,
  AdminCrudEmbeddedLocalInputConfig,
  AdminCrudEnumInputConfig,
  AdminCrudFileInputConfig,
  AdminCrudForeignInputConfig,
  AdminCrudInputConfig,
  AdminCrudPasswordInputConfig,
  AdminCrudTextInputConfig,
  ModelScalarFieldConfig,
} from '@src/schema/index.js';

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
    nullLabel: field.nullLabel,
  };
}

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
    throw new Error(
      `Field ${field.modelField} cannot be found in ${modelName}`
    );
  }
  return {
    name: field.modelField,
    generator: '@baseplate/react/admin/admin-crud-text-input',
    label: field.label,
    modelField: field.modelField,
    type: getInputType(fieldConfig),
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

function compileAdminCrudEmbeddedInput(
  field: AdminCrudEmbeddedInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  crudSectionId: string
): unknown {
  return {
    name: field.modelRelation,
    generator: '@baseplate/react/admin/admin-crud-embedded-input',
    label: field.label,
    modelRelation: field.modelRelation,
    embeddedFormRef: `${crudSectionId}.edit.embeddedForms.${field.embeddedFormName}`,
  };
}

function compileAdminCrudEmbeddedLocalInput(
  field: AdminCrudEmbeddedLocalInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  crudSectionId: string
): unknown {
  const localRelation = builder.parsedProject
    .getModelByName(modelName)
    .model.relations?.find((r) => r.name === field.localRelation);

  if (!localRelation) {
    throw new Error(
      `Could not find relation ${field.localRelation} in model ${modelName}`
    );
  }

  return {
    name: field.localRelation,
    generator: '@baseplate/react/admin/admin-crud-embedded-input',
    label: field.label,
    modelRelation: field.localRelation,
    isRequired: !localRelation.isOptional,
    embeddedFormRef: `${crudSectionId}.edit.embeddedForms.${field.embeddedFormName}`,
  };
}

function compileAdminCrudPasswordInput(
  field: AdminCrudPasswordInputConfig
): unknown {
  return {
    name: 'password',
    generator: '@baseplate/react/admin/admin-crud-password-input',
    label: field.label,
  };
}

export function compileAdminCrudInput(
  field: AdminCrudInputConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  crudSectionId: string
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
    case 'password':
      return compileAdminCrudPasswordInput(field);
    case 'embedded':
      return compileAdminCrudEmbeddedInput(
        field,
        modelName,
        builder,
        crudSectionId
      );
    case 'embeddedLocal':
      return compileAdminCrudEmbeddedLocalInput(
        field,
        modelName,
        builder,
        crudSectionId
      );
    default:
      throw new Error(
        `Unknown admin crud input ${(field as { type: string }).type}`
      );
  }
}
