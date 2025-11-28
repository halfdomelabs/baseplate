import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type { DefinitionSchemaCreator } from '#src/schema/creator/types.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

import type { AdminCrudActionSchema, AdminCrudActionType } from './types.js';

import { BUILT_IN_ADMIN_CRUD_ACTIONS } from './built-in-actions.js';

/**
 * Spec for registering additional admin CRUD table actions
 */
export interface AdminCrudActionSpec extends PluginSpecImplementation {
  registerAdminCrudAction: <
    T extends DefinitionSchemaCreator<AdminCrudActionSchema>,
  >(
    action: AdminCrudActionType<T>,
  ) => void;
  getAdminCrudActions: () => Map<string, AdminCrudActionType>;
  getAdminCrudAction: (name: string) => AdminCrudActionType;
}

export function createAdminCrudActionImplementation(): AdminCrudActionSpec {
  const adminCrudActions = new Map<string, AdminCrudActionType>(
    BUILT_IN_ADMIN_CRUD_ACTIONS.map((action) => [action.name, action]),
  );

  return {
    registerAdminCrudAction(action) {
      if (adminCrudActions.has(action.name)) {
        throw new Error(
          `Admin CRUD action with name ${action.name} is already registered`,
        );
      }
      adminCrudActions.set(
        action.name,
        action as unknown as AdminCrudActionType,
      );
    },
    getAdminCrudActions() {
      return adminCrudActions;
    },
    getAdminCrudAction(name) {
      const action = adminCrudActions.get(name);
      if (!action) {
        throw new Error(`Unable to find action with name ${name}`);
      }
      return action;
    },
  };
}

/**
 * Spec for adding admin CRUD actions
 */
export const adminCrudActionSpec = createPluginSpec('core/admin-crud-action', {
  defaultInitializer: createAdminCrudActionImplementation,
});
