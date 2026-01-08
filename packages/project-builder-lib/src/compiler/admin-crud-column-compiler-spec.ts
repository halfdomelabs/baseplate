import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type {
  AdminCrudColumnDefinition,
  AdminCrudSectionConfig,
  ModelConfig,
} from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

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
 * Spec for registering admin CRUD column compilers
 */
export const adminCrudColumnCompilerSpec = createFieldMapSpec(
  'core/admin-crud-column-compiler',
  (t) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: t.namedArray<AdminCrudColumnCompiler<any>>(),
  }),
);
