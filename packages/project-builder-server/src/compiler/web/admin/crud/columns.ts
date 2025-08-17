import type {
  AdminCrudColumnDefinition,
  AdminCrudForeignColumnDefinition,
  AdminCrudSectionConfig,
  AdminCrudTextColumnDefinition,
  WebAppConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  adminCrudColumnCompilerSpec,
  createAdminCrudColumnCompiler,
  ModelFieldUtils,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudForeignColumnGenerator,
  adminCrudTextColumnGenerator,
} from '@baseplate-dev/react-generators';

import type { AppEntryBuilder } from '#src/compiler/app-entry-builder.js';

// Built-in column compilers
const BUILT_IN_COLUMN_COMPILERS = [
  createAdminCrudColumnCompiler<AdminCrudTextColumnDefinition>({
    name: 'text',
    compileColumn: (column, options) =>
      adminCrudTextColumnGenerator({
        id: column.id,
        label: column.label,
        order: options.order,
        modelField: options.definitionContainer.nameFromId(
          column.modelFieldRef,
        ),
      }),
  }),
  createAdminCrudColumnCompiler<AdminCrudForeignColumnDefinition>({
    name: 'foreign',
    compileColumn: (column, { definitionContainer, model, order }) => {
      const relation = model.model.relations?.find(
        (r) => r.id === column.localRelationRef,
      );
      const localRelationName = definitionContainer.nameFromId(
        column.localRelationRef,
      );

      if (!relation) {
        throw new Error(
          `Could not find relation ${localRelationName} in model ${model.name}`,
        );
      }

      if (relation.references.length !== 1) {
        throw new Error(`Only relations with a single reference are supported`);
      }

      const localField = definitionContainer.nameFromId(
        relation.references[0].localRef,
      );
      const foreignModelName = definitionContainer.nameFromId(
        relation.modelRef,
      );
      return adminCrudForeignColumnGenerator({
        id: column.id,
        label: column.label,
        order,
        localField,
        isOptional: ModelFieldUtils.isRelationOptional(model, relation),
        foreignModelName,
        labelExpression: column.labelExpression,
        valueExpression: column.valueExpression,
      });
    },
  }),
];

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
  const { definitionContainer } = builder;

  // Get the registered column compiler for this type
  const columnCompilers = definitionContainer.pluginStore.getPluginSpec(
    adminCrudColumnCompilerSpec,
  );

  const compiler = columnCompilers.getCompiler(
    column.type,
    BUILT_IN_COLUMN_COMPILERS,
  );

  return compiler.compileColumn(column, {
    order,
    model: ModelUtils.byIdOrThrow(builder.projectDefinition, modelId),
    definitionContainer,
    modelCrudSection,
  });
}
