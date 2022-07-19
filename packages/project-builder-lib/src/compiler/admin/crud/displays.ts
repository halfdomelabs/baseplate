import { AppEntryBuilder } from '@src/compiler/appEntryBuilder';
import {
  AdminAppConfig,
  AdminCrudDisplayConfig,
  AdminCrudTextDisplayConfig,
} from '@src/schema';

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
    default:
      throw new Error(
        `Unknown admin crud display ${(field as { type: string }).type}`
      );
  }
}
