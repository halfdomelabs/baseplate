import type {
  AdminCrudInputDefinition,
  WebAppConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  adminCrudInputCompilerSpec,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';

import type { AppEntryBuilder } from '#src/compiler/app-entry-builder.js';

export function compileAdminCrudInput(
  field: AdminCrudInputDefinition,
  modelId: string,
  builder: AppEntryBuilder<WebAppConfig>,
  crudSectionId: string,
  order: number,
): GeneratorBundle {
  const inputCompiler = builder.pluginStore.getPluginSpec(
    adminCrudInputCompilerSpec,
  );

  const compiler = inputCompiler.inputs.get(field.type);

  if (!compiler) {
    throw new Error(`Compiler for input type ${field.type} not found`);
  }

  return compiler.compileInput(field, {
    order,
    definitionContainer: builder.definitionContainer,
    model: ModelUtils.byIdOrThrow(builder.projectDefinition, modelId),
    crudSectionId,
  });
}
