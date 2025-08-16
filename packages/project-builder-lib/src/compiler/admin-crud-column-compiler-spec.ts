import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { PluginSpecImplementation } from '#src/plugins/spec/types.js';
import type {
  AdminCrudColumnDefinition,
  AdminCrudSectionConfig,
  ModelConfig,
} from '#src/schema/index.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

export interface AdminCrudColumnCompiler<
  T extends AdminCrudColumnDefinition = AdminCrudColumnDefinition,
> {
  name: string;
  compileColumn: (
    definition: T,
    options: {
      order: number;
      definitionContainer: ProjectDefinitionContainer;
      model: ModelConfig;
      modelCrudSection: AdminCrudSectionConfig;
    },
  ) => GeneratorBundle;
}

export function createAdminCrudColumnCompiler<
  T extends AdminCrudColumnDefinition = AdminCrudColumnDefinition,
>(input: AdminCrudColumnCompiler<T>): AdminCrudColumnCompiler<T> {
  return input;
}

/**
 * Spec for registering column compilers
 */
export interface AdminCrudColumnCompilerSpec extends PluginSpecImplementation {
  registerCompiler: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    column: AdminCrudColumnCompiler<any>,
  ) => void;
  getCompiler: (
    type: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builtInColumns?: AdminCrudColumnCompiler<any>[],
  ) => AdminCrudColumnCompiler;
  getColumnCompilers: () => Map<string, AdminCrudColumnCompiler>;
}

export function createAdminCrudColumnCompilerImplementation(): AdminCrudColumnCompilerSpec {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = new Map<string, AdminCrudColumnCompiler<any>>();

  return {
    registerCompiler(column) {
      if (columns.has(column.name)) {
        throw new Error(
          `Admin CRUD column with name ${column.name} is already registered`,
        );
      }
      columns.set(column.name, column);
    },
    getCompiler(type, builtInColumns = []) {
      const builtInColumn = builtInColumns.find((b) => b.name === type);
      if (builtInColumn) {
        return builtInColumn as AdminCrudColumnCompiler;
      }
      const column = columns.get(type);
      if (!column) {
        throw new Error(`Unable to find column with type ${type}`);
      }
      return column as AdminCrudColumnCompiler;
    },
    getColumnCompilers() {
      return columns;
    },
  };
}

/**
 * Spec for adding column compilers
 */
export const adminCrudColumnCompilerSpec = createPluginSpec(
  'core/admin-crud-column-compiler',
  { defaultInitializer: createAdminCrudColumnCompilerImplementation },
);
