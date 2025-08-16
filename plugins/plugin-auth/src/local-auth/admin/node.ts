import type {
  AdminCrudActionCompiler,
  AuthConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import {
  adminCrudActionCompilerSpec,
  authConfigSpec,
  createPlatformPluginExport,
} from '@baseplate-dev/project-builder-lib';

import type { AdminCrudManageRolesActionDefinition } from './schema/manage-role-action.js';

import { adminCrudManageRolesActionGenerator } from './generators/admin-crud-manage-roles-action/index.js';

function buildManageRolesActionCompiler(
  authConfig: AuthConfigSpec,
): AdminCrudActionCompiler<AdminCrudManageRolesActionDefinition> {
  return {
    name: 'manage-roles',
    compileAction(definition, { order, model, definitionContainer }) {
      const userModelName = definitionContainer.nameFromId(model.id);

      return adminCrudManageRolesActionGenerator({
        order,
        position: definition.position,
        userModelName,
        availableRoles: authConfig
          .getAuthRoles(definitionContainer.definition)
          .filter((r) => !r.builtIn),
      });
    },
  };
}

export default createPlatformPluginExport({
  dependencies: {
    adminCrudActionCompiler: adminCrudActionCompilerSpec,
    authConfig: authConfigSpec,
  },
  exports: {},
  initialize: ({ adminCrudActionCompiler, authConfig }) => {
    adminCrudActionCompiler.registerCompiler(
      buildManageRolesActionCompiler(authConfig),
    );
    return {};
  },
});
