import type { AdminCrudActionCompiler } from '@baseplate-dev/project-builder-lib';

import {
  adminCrudActionCompilerSpec,
  createPlatformPluginExport,
} from '@baseplate-dev/project-builder-lib';

import type { AdminCrudManageRolesActionDefinition } from './schema/manage-role-action.js';

import { adminCrudManageRolesActionGenerator } from './generators/admin-crud-manage-roles-action/index.js';

function buildManageRolesActionCompiler(): AdminCrudActionCompiler<AdminCrudManageRolesActionDefinition> {
  return {
    name: 'manage-roles',
    compileAction(definition, { order, model, definitionContainer }) {
      const userModelName = definitionContainer.nameFromId(model.id);

      return adminCrudManageRolesActionGenerator({
        order,
        position: definition.position,
        userModelName,
      });
    },
  };
}

export default createPlatformPluginExport({
  dependencies: {
    adminCrudActionCompiler: adminCrudActionCompilerSpec,
  },
  exports: {},
  initialize: ({ adminCrudActionCompiler }) => {
    adminCrudActionCompiler.registerCompiler(buildManageRolesActionCompiler());
    return {};
  },
});
