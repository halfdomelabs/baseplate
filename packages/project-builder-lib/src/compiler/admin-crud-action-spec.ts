import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type {
  AdminCrudActionInput,
  AdminCrudSectionConfig,
  ModelConfig,
} from '#src/schema/index.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

export interface AdminCrudActionCompiler<
  T extends AdminCrudActionInput = AdminCrudActionInput,
> {
  name: string;
  compileAction: (
    definition: T,
    options: {
      order: number;
      definitionContainer: ProjectDefinitionContainer;
      model: ModelConfig;
      modelCrudSection: AdminCrudSectionConfig;
    },
  ) => GeneratorBundle;
}

/**
 * Spec for registering action compilers
 */
export interface AdminCrudActionCompilerSpec extends PluginSpecImplementation {
  registerCompiler: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: AdminCrudActionCompiler<any>,
  ) => void;
  getCompiler: (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInActions?: AdminCrudActionCompiler<any>[],
  ) => AdminCrudActionCompiler;
}

export function createAdminCrudActionCompilerImplementation(): AdminCrudActionCompilerSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions = new Map<string, AdminCrudActionCompiler<any>>();

  return {
    registerCompiler(action) {
      if (actions.has(action.name)) {
        throw new Error(
          `Admin CRUD action with name ${action.name} is already registered`,
        );
      }
      actions.set(action.name, action);
    },
    getCompiler(name, builtInActions = []) {
      const builtInAction = builtInActions.find((b) => b.name === name);
      if (builtInAction) {
        return builtInAction as AdminCrudActionCompiler;
      }
      const action = actions.get(name);
      if (!action) {
        throw new Error(`Unable to find action with name ${name}`);
      }
      return action as AdminCrudActionCompiler;
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const adminCrudActionCompilerSpec = createPluginSpec(
  'core/admin-crud-action-compiler',
  { defaultInitializer: createAdminCrudActionCompilerImplementation },
);
