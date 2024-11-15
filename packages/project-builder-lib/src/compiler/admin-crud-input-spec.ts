import type { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import type { PluginSpecImplementation } from '@src/plugins/spec/types.js';
import type {
  AdminCrudInputDefinition,
  ModelConfig,
} from '@src/schema/index.js';

import { createPluginSpec } from '@src/plugins/spec/types.js';

import type { DescriptorWithChildren } from './types.js';

export interface AdminCrudInputCompiler<
  T extends AdminCrudInputDefinition = AdminCrudInputDefinition,
> {
  name: string;
  compileInput: (
    definition: T,
    {
      definitionContainer,
      model,
    }: {
      definitionContainer: ProjectDefinitionContainer;
      model: ModelConfig;
      crudSectionId: string;
    },
  ) => DescriptorWithChildren;
}

/**
 * Spec for registering input compilers
 */
export interface AdminCrudInputCompilerSpec extends PluginSpecImplementation {
  registerCompiler: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: AdminCrudInputCompiler<any>,
  ) => void;
  getCompiler: (
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInInputs?: AdminCrudInputCompiler<any>[],
  ) => AdminCrudInputCompiler;
}

export function createAdminCrudInputCompilerImplementation(): AdminCrudInputCompilerSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputs = new Map<string, AdminCrudInputCompiler<any>>();

  return {
    registerCompiler(input) {
      if (inputs.has(input.name)) {
        throw new Error(
          `Admin CRUD input with name ${input.name} is already registered`,
        );
      }
      inputs.set(input.name, input);
    },
    getCompiler(name, builtInInputs = []) {
      const builtInInput = builtInInputs.find((b) => b.name === name);
      if (builtInInput) {
        return builtInInput as AdminCrudInputCompiler;
      }
      const input = inputs.get(name);
      if (!input) {
        throw new Error(`Unable to find input with name ${name}`);
      }
      return input as AdminCrudInputCompiler;
    },
  };
}

/**
 * Spec for adding config component for plugin
 */
export const adminCrudInputCompilerSpec = createPluginSpec(
  'core/admin-crud-input-compiler',
  { defaultInitializer: createAdminCrudInputCompilerImplementation },
);
