import type {
  AdminCrudActionInput,
  AdminCrudSectionConfig,
  WebAppConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import { adminCrudActionCompilerSpec } from '@baseplate-dev/project-builder-lib';

import type { AppEntryBuilder } from '#src/compiler/app-entry-builder.js';

export function compileAdminCrudAction(
  action: AdminCrudActionInput,
  modelId: string,
  builder: AppEntryBuilder<WebAppConfig>,
  modelCrudSection: AdminCrudSectionConfig,
  order: number,
): GeneratorBundle {
  const actionCompiler = builder.pluginStore.use(adminCrudActionCompilerSpec);

  const compiler = actionCompiler.actions.find((c) => c.name === action.type);

  if (!compiler) {
    throw new Error(`Compiler for action type ${action.type} not found`);
  }

  const model = builder.projectDefinition.models.find((m) => m.id === modelId);
  if (!model) {
    throw new Error(`Model with id ${modelId} not found`);
  }

  return compiler.compileAction(action, {
    order,
    definitionContainer: builder.definitionContainer,
    model,
    modelCrudSection,
  });
}
