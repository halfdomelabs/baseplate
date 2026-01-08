import type {
  AdminCrudColumnDefinition,
  AdminCrudSectionConfig,
  WebAppConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  adminCrudColumnCompilerSpec,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';

import type { AppEntryBuilder } from '#src/compiler/app-entry-builder.js';

/**
 * Compiles an admin CRUD column definition into generator bundles
 */
export function compileAdminCrudColumn(
  column: AdminCrudColumnDefinition,
  modelId: string,
  builder: AppEntryBuilder<WebAppConfig>,
  modelCrudSection: AdminCrudSectionConfig,
  order: number,
): GeneratorBundle {
  const columnCompiler = builder.pluginStore.use(adminCrudColumnCompilerSpec);

  const compiler = columnCompiler.columns.get(column.type);

  if (!compiler) {
    throw new Error(`Compiler for column type ${column.type} not found`);
  }

  const model = ModelUtils.byIdOrThrow(builder.projectDefinition, modelId);

  return compiler.compileColumn(column, {
    order,
    definitionContainer: builder.definitionContainer,
    model,
    modelCrudSection,
  });
}
