import type {
  AdminAppConfig,
  AdminCrudDisplayConfig,
  AdminCrudForeignDisplayConfig,
  AdminCrudTextDisplayConfig,
} from '@halfdomelabs/project-builder-lib';

import { ModelFieldUtils } from '@halfdomelabs/project-builder-lib';

import type { AppEntryBuilder } from '@src/compiler/app-entry-builder.js';

function compileAdminCrudForeignDisplay(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudForeignDisplayConfig,
  modelId: string,
): unknown {
  const model = builder.parsedProject.getModelById(modelId);
  const relation = model.model.relations?.find(
    (r) => r.id === field.localRelationRef,
  );
  const localRelationName = builder.nameFromId(field.localRelationRef);

  if (!relation) {
    throw new Error(
      `Could not find relation ${localRelationName} in model ${model.name}`,
    );
  }

  if (relation.references.length !== 1) {
    throw new Error(`Only relations with a single reference are supported`);
  }

  const localField = builder.nameFromId(relation.references[0].localRef);
  const foreignModelName = builder.nameFromId(relation.modelName);
  return {
    name: localRelationName,
    generator: '@halfdomelabs/react/admin/admin-crud-foreign-display',
    isOptional: ModelFieldUtils.isRelationOptional(model, relation),
    localField,
    foreignModelName,
    labelExpression: field.labelExpression,
    valueExpression: field.valueExpression,
  };
}

function compileAdminCrudTextDisplay(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudTextDisplayConfig,
  modelId: string,
): unknown {
  const model = builder.parsedProject.getModelById(modelId);
  const fieldConfig = model.model.fields.find(
    (f) => f.id === field.modelFieldRef,
  );
  if (!fieldConfig) {
    throw new Error(
      `Field ${field.modelFieldRef} cannot be found in ${model.name}`,
    );
  }
  return {
    name: fieldConfig.name,
    generator: '@halfdomelabs/react/admin/admin-crud-text-display',
    modelField: fieldConfig.name,
  };
}

export function compileAdminCrudDisplay(
  builder: AppEntryBuilder<AdminAppConfig>,
  field: AdminCrudDisplayConfig,
  modelId: string,
): unknown {
  switch (field.type) {
    case 'text': {
      return compileAdminCrudTextDisplay(builder, field, modelId);
    }
    case 'foreign': {
      return compileAdminCrudForeignDisplay(builder, field, modelId);
    }
    default: {
      throw new Error(
        `Unknown admin crud display ${(field as { type: string }).type}`,
      );
    }
  }
}
