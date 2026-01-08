import type {
  AdminCrudActionCompiler,
  AdminCrudColumnCompiler,
  AuthConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import {
  adminCrudActionCompilerSpec,
  adminCrudColumnCompilerSpec,
  authConfigSpec,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import type { AdminCrudManageRolesActionDefinition } from './schema/manage-role-action.js';
import type { AdminCrudResetPasswordActionDefinition } from './schema/reset-password-action.js';
import type { AdminCrudRolesColumnDefinition } from './schema/roles-column.js';

import { adminCrudManageRolesActionGenerator } from './generators/admin-crud-manage-roles-action/index.js';
import { adminCrudResetPasswordActionGenerator } from './generators/admin-crud-reset-password-action/index.js';
import { adminCrudRolesColumnGenerator } from './generators/admin-crud-roles-column/index.js';

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
    compileAction(definition, { order, definitionContainer }) {
      return adminCrudManageRolesActionGenerator({
        order,
        position: definition.position,
        availableRoles: authConfig
          .getAuthRoles(definitionContainer.definition)
          .filter((r) => !r.builtIn),
      });
    },
  };
}

function buildResetPasswordActionCompiler(): AdminCrudActionCompiler<AdminCrudResetPasswordActionDefinition> {
  return {
    name: 'reset-password',
    compileAction(definition, { order }) {
      return adminCrudResetPasswordActionGenerator({
        order,
        position: definition.position,
      });
    },
  };
}

export default createPluginModule({
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
    adminCrudActionCompiler.registerCompiler(
      buildResetPasswordActionCompiler(),
    );
    adminCrudColumnCompiler.registerCompiler(buildRolesColumnCompiler());
    return {};
  },
});
