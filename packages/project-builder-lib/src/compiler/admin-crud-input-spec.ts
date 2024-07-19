import type { DescriptorWithChildren } from './types.js';
import { ProjectDefinitionContainer } from '@src/definition/project-definition-container.js';
import {
  PluginSpecImplementation,
  createPluginSpec,
} from '@src/plugins/spec/types.js';
import { AdminCrudInputDefinition, ModelConfig } from '@src/schema/index.js';

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
  const inputs: Record<string, AdminCrudInputCompiler<any>> = {};

  return {
    registerCompiler(input) {
      if (inputs[input.name]) {
        throw new Error(
          `Admin CRUD input with name ${input.name} is already registered`,
        );
      }
      inputs[input.name] = input;
    },
    getCompiler(name, builtInInputs = []) {
      const builtInInput = builtInInputs.find((b) => b.name === name);
      if (builtInInput) {
        return builtInInput as AdminCrudInputCompiler;
      }
      const input = inputs[name];
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
