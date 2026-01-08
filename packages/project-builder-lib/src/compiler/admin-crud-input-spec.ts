import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { AdminCrudInputInput, ModelConfig } from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

export interface AdminCrudInputCompiler<
  T extends AdminCrudInputInput = AdminCrudInputInput,
> {
  name: string;
  compileInput: (
    definition: T,
    options: {
      order: number;
      definitionContainer: ProjectDefinitionContainer;
      model: ModelConfig;
      crudSectionId: string;
    },
  ) => GeneratorBundle;
}

/**
 * Spec for registering admin CRUD input compilers
 */
export const adminCrudInputCompilerSpec = createFieldMapSpec(
  'core/admin-crud-input-compiler',
  (t) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inputs: t.namedArray<AdminCrudInputCompiler<any>>(),
  }),
);
