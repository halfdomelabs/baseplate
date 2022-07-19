import { AppEntryBuilder } from '@src/compiler/appEntryBuilder';
import {
  AdminAppConfig,
  AdminCrudDisplayConfig,
  AdminCrudForeignDisplayConfig,
  AdminCrudTextDisplayConfig,
} from '@src/schema';

function compileAdminCrudForeignDisplay(
  field: AdminCrudForeignDisplayConfig,
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
    generator: '@baseplate/react/admin/admin-crud-foreign-display',
    isOptional: relation.isOptional,
    localField,
    foreignModelName: relation.modelName,
    labelExpression: field.labelExpression,
    valueExpression: field.valueExpression,
  };
}

function compileAdminCrudTextDisplay(
  field: AdminCrudTextDisplayConfig,
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
    generator: '@baseplate/react/admin/admin-crud-text-display',
    modelField: field.modelField,
  };
}

export function compileAdminCrudDisplay(
  field: AdminCrudDisplayConfig,
  modelName: string,
  builder: AppEntryBuilder<AdminAppConfig>
): unknown {
  switch (field.type) {
    case 'text':
      return compileAdminCrudTextDisplay(field, modelName, builder);
    case 'foreign':
      return compileAdminCrudForeignDisplay(field, modelName, builder);
    default:
      throw new Error(
        `Unknown admin crud display ${(field as { type: string }).type}`
      );
  }
}
