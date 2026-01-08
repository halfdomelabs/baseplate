import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type {
  AdminCrudActionInput,
  AdminCrudSectionConfig,
  ModelConfig,
} from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

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

export const adminCrudActionCompilerSpec = createFieldMapSpec(
  'core/admin-crud-action-compiler',
  (t) => ({
    actions: t.map<string, AdminCrudActionCompiler>(),
  }),
);
