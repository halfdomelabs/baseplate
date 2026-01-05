import type {
  AdminCrudActionCompiler,
  AdminCrudActionInput,
  AdminCrudDeleteActionConfig,
  AdminCrudEditActionConfig,
  AdminCrudSectionConfig,
  WebAppConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { adminCrudActionCompilerSpec } from '@baseplate-dev/project-builder-lib';
import {
  adminCrudDeleteActionGenerator,
  adminCrudEditActionGenerator,
} from '@baseplate-dev/react-generators';

import type { AppEntryBuilder } from '#src/compiler/app-entry-builder.js';

const adminCrudEditActionCompiler: AdminCrudActionCompiler<AdminCrudEditActionConfig> =
  {
    name: 'edit',
    compileAction: (definition, { order }) =>
      adminCrudEditActionGenerator({
        order,
        position: definition.position,
      }),
  };

const adminCrudDeleteActionCompiler: AdminCrudActionCompiler<AdminCrudDeleteActionConfig> =
  {
    name: 'delete',
    compileAction: (
      definition,
      { order, model, modelCrudSection, definitionContainer },
    ) => {
      if (model.model.primaryKeyFieldRefs.length !== 1) {
        throw new Error(
          `Model ${model.name} must have exactly one primary key field`,
        );
      }
      return adminCrudDeleteActionGenerator({
        order,
        position: definition.position,
        modelName: model.name,
        nameField: definitionContainer.nameFromId(
          modelCrudSection.nameFieldRef,
        ),
        idField: definitionContainer.nameFromId(
          model.model.primaryKeyFieldRefs[0],
        ),
      });
    },
  };

const builtInCompilers = [
  adminCrudEditActionCompiler,
  adminCrudDeleteActionCompiler,
];

export function compileAdminCrudAction(
  action: AdminCrudActionInput,
  modelId: string,
  builder: AppEntryBuilder<WebAppConfig>,
  modelCrudSection: AdminCrudSectionConfig,
  order: number,
): GeneratorBundle {
  const actionCompiler = builder.pluginStore.getPluginSpec(
    adminCrudActionCompilerSpec,
  );

  const compiler = actionCompiler.getCompiler(action.type, builtInCompilers);

  const model = builder.projectDefinition.models.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Model with id ${modelId} not found`);
  }

  return compiler.compileAction(action, {
    order,
    definitionContainer: builder.definitionContainer,
    model,
    modelCrudSection,
  });
}
