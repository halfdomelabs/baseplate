import type {
  AdminCrudActionCompiler,
  AdminCrudDeleteActionConfig,
  AdminCrudEditActionConfig,
} from '@baseplate-dev/project-builder-lib';

import {
  adminCrudActionCompilerSpec,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudDeleteActionGenerator,
  adminCrudEditActionGenerator,
} from '@baseplate-dev/react-generators';

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

export const adminCrudActionCoreModule = createPluginModule({
  name: 'admin-crud-action-compiler',
  dependencies: {
    adminCrudActionCompiler: adminCrudActionCompilerSpec,
  },
  initialize: ({ adminCrudActionCompiler }) => {
    adminCrudActionCompiler.actions.addMany([
      adminCrudEditActionCompiler,
      adminCrudDeleteActionCompiler,
    ]);
  },
});
