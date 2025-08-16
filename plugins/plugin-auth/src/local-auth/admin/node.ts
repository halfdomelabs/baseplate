import type {
  AdminCrudActionCompiler,
  AdminCrudColumnCompiler,
  AuthConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import {
  adminCrudActionCompilerSpec,
  adminCrudColumnCompilerSpec,
  authConfigSpec,
  createPlatformPluginExport,
} from '@baseplate-dev/project-builder-lib';

import type { AdminCrudManageRolesActionDefinition } from './schema/manage-role-action.js';
import type { AdminCrudRolesColumnDefinition } from './schema/roles-column.js';

import { adminCrudManageRolesActionGenerator } from './generators/admin-crud-manage-roles-action/index.js';
import { adminCrudRolesColumnGenerator } from './generators/admin-crud-roles-column/admin-crud-roles-column.generator.js';

function buildRolesColumnCompiler(): AdminCrudColumnCompiler<AdminCrudRolesColumnDefinition> {
  return {
    name: 'roles',
    compileColumn(definition, { order }) {
      return adminCrudRolesColumnGenerator({
        id: definition.id,
        label: definition.label,
        order,
      });
    },
  };
}

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
    adminCrudColumnCompiler: adminCrudColumnCompilerSpec,
    authConfig: authConfigSpec,
  },
  exports: {},
  initialize: ({
    adminCrudActionCompiler,
    authConfig,
    adminCrudColumnCompiler,
  }) => {
    adminCrudActionCompiler.registerCompiler(
      buildManageRolesActionCompiler(authConfig),
    );
    adminCrudColumnCompiler.registerCompiler(buildRolesColumnCompiler());
    return {};
  },
});
