import { AppEntryBuilder } from '@src/compiler/appEntryBuilder.js';
import { ModelFieldUtils } from '@src/definition/model/model-field-utils.js';
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
  FileTransformerConfig,
  ModelScalarFieldConfig,
} from '@src/schema/index.js';

function compileAdminEnumInput(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudEnumInputConfig,
  modelId: string,
): unknown {
  const model = builder.parsedProject.getModelById(modelId);
  const fieldConfig = model.model.fields.find((f) => f.id === field.modelField);
  if (fieldConfig?.type !== 'enum') {
    throw new Error(`Admin enum input ${field.modelField} is not an enum`);
  }
  const enumBlock = builder.parsedProject
    .getEnums()
    .find((e) => e.id === fieldConfig.options?.enumType);
  if (!enumBlock) {
    throw new Error(
      `Could not find enum type ${fieldConfig.options?.enumType ?? ''}`,
    );
  }
  const fieldName = builder.nameFromId(field.modelField);
  return {
    name: fieldName,
    generator: '@halfdomelabs/react/admin/admin-crud-enum-input',
    modelField: fieldName,
    label: field.label,
    isOptional: fieldConfig.isOptional,
    options: enumBlock.values.map((v) => ({
      label: v.friendlyName,
      value: v.name,
    })),
  };
}

function compileAdminForeignInput(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudForeignInputConfig,
  modelId: string,
): unknown {
  const model = builder.parsedProject.getModelById(modelId);
  const relation = model.model.relations?.find(
    (r) => r.id === field.localRelationName,
  );

  if (!relation) {
    throw new Error(
      `Could not find relation ${field.localRelationName} in model ${model.name}`,
    );
  }

  if (relation.references.length !== 1) {
    throw new Error(`Only relations with a single reference are supported`);
  }

  const localField = builder.nameFromId(relation.references[0].local);

  return {
    name: relation.name,
    generator: '@halfdomelabs/react/admin/admin-crud-foreign-input',
    label: field.label,
    localRelationName: relation.name,
    isOptional: ModelFieldUtils.isRelationOptional(model, relation),
    localField,
    foreignModelName: builder.nameFromId(relation.modelName),
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
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudTextInputConfig,
  modelId: string,
): unknown {
  const model = builder.parsedProject.getModelById(modelId);
  const fieldConfig = model.model.fields.find((f) => f.id === field.modelField);
  if (!fieldConfig) {
    throw new Error(
      `Field ${field.modelField} cannot be found in ${model.name}`,
    );
  }
  const fieldName = builder.nameFromId(field.modelField);
  return {
    name: fieldName,
    generator: '@halfdomelabs/react/admin/admin-crud-text-input',
    label: field.label,
    modelField: fieldName,
    type: getInputType(fieldConfig),
    validation: !field.validation
      ? ModelFieldUtils.getModelFieldValidation(
          builder.projectConfig,
          modelId,
          fieldConfig.id,
          true,
        )
      : field.validation,
  };
}

function compileAdminCrudFileInput(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudFileInputConfig,
  modelId: string,
): unknown {
  const model = builder.parsedProject.getModelById(modelId);
  const transformer = model.service?.transformers?.find(
    (t): t is FileTransformerConfig =>
      t.id === field.modelRelation && t.type === 'file',
  );
  const relation = model.model.relations?.find(
    (r) => r.id === transformer?.fileRelationRef,
  );

  if (!relation) {
    throw new Error(
      `Could not find relation ${field.modelRelation} in model ${model.name}`,
    );
  }

  const category = builder.parsedProject.projectConfig.storage?.categories.find(
    (c) => c.usedByRelation === relation.foreignId,
  );

  if (!category) {
    throw new Error(
      `Could not find category for relation ${relation.foreignRelationName}`,
    );
  }
  const isOptional = ModelFieldUtils.isRelationOptional(model, relation);
  const relationName = builder.nameFromId(field.modelRelation);

  return {
    name: relationName,
    generator: '@halfdomelabs/react/admin/admin-crud-file-input',
    label: field.label,
    isOptional,
    category: category.name,
    modelRelation: relationName,
  };
}

function compileAdminCrudEmbeddedInput(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudEmbeddedInputConfig,
  crudSectionId: string,
): unknown {
  const relationName = builder.nameFromId(field.modelRelation);
  return {
    name: relationName,
    generator: '@halfdomelabs/react/admin/admin-crud-embedded-input',
    label: field.label,
    modelRelation: relationName,
    embeddedFormRef: `${crudSectionId}.edit.embeddedForms.${builder.nameFromId(
      field.embeddedFormName,
    )}`,
  };
}

function compileAdminCrudEmbeddedLocalInput(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudEmbeddedLocalInputConfig,
  modelId: string,
  crudSectionId: string,
): unknown {
  const model = builder.parsedProject.getModelById(modelId);
  const localRelation = model.model.relations?.find(
    (r) => r.id === field.localRelation,
  );

  if (!localRelation) {
    throw new Error(
      `Could not find relation ${field.localRelation} in model ${model.name}`,
    );
  }

  const localRelationName = builder.nameFromId(field.localRelation);

  return {
    name: localRelationName,
    generator: '@halfdomelabs/react/admin/admin-crud-embedded-input',
    label: field.label,
    modelRelation: localRelationName,
    isRequired: !ModelFieldUtils.isRelationOptional(model, localRelation),
    embeddedFormRef: `${crudSectionId}.edit.embeddedForms.${builder.nameFromId(
      field.embeddedFormName,
    )}`,
  };
}

function compileAdminCrudPasswordInput(
  field: AdminCrudPasswordInputConfig,
): unknown {
  return {
    name: 'password',
    generator: '@halfdomelabs/react/admin/admin-crud-password-input',
    label: field.label,
  };
}

export function compileAdminCrudInput(
  field: AdminCrudInputConfig,
  modelId: string,
  builder: AppEntryBuilder<AdminAppConfig>,
  crudSectionId: string,
): unknown {
  switch (field.type) {
    case 'foreign':
      return compileAdminForeignInput(builder, field, modelId);
    case 'enum':
      return compileAdminEnumInput(builder, field, modelId);
    case 'text':
      return compileAdminCrudTextInput(builder, field, modelId);
    case 'file':
      return compileAdminCrudFileInput(builder, field, modelId);
    case 'password':
      return compileAdminCrudPasswordInput(field);
    case 'embedded':
      return compileAdminCrudEmbeddedInput(builder, field, crudSectionId);
    case 'embeddedLocal':
      return compileAdminCrudEmbeddedLocalInput(
        builder,
        field,
        modelId,
        crudSectionId,
      );
    default:
      throw new Error(
        `Unknown admin crud input ${(field as { type: string }).type}`,
      );
  }
}
