import type {
  AdminCrudColumnCompiler,
  AdminCrudForeignColumnDefinition,
  AdminCrudTextColumnDefinition,
} from '@baseplate-dev/project-builder-lib';

import {
  adminCrudColumnCompilerSpec,
  createPluginModule,
  ModelFieldUtils,
  ModelUtils,
} from '@baseplate-dev/project-builder-lib';
import {
  adminCrudForeignColumnGenerator,
  adminCrudTextColumnGenerator,
} from '@baseplate-dev/react-generators';

const adminCrudTextColumnCompiler: AdminCrudColumnCompiler<AdminCrudTextColumnDefinition> =
  {
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
  };

const adminCrudForeignColumnCompiler: AdminCrudColumnCompiler<AdminCrudForeignColumnDefinition> =
  {
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

      const foreignModelIdFields = ModelUtils.byIdOrThrow(
        definitionContainer.definition,
        relation.modelRef,
      ).model.primaryKeyFieldRefs.map((ref) =>
        definitionContainer.nameFromId(ref),
      );

      return adminCrudForeignColumnGenerator({
        id: column.id,
        label: column.label,
        order,
        relationName: localRelationName,
        foreignModelIdFields,
        isOptional: ModelFieldUtils.isRelationOptional(model, relation),
        labelExpression: column.labelExpression,
      });
    },
  };

export const adminCrudColumnCoreModule = createPluginModule({
  name: 'admin-crud-column-compiler',
  dependencies: {
    adminCrudColumnCompiler: adminCrudColumnCompilerSpec,
  },
  initialize: ({ adminCrudColumnCompiler }) => {
    adminCrudColumnCompiler.columns.addMany([
      adminCrudTextColumnCompiler,
      adminCrudForeignColumnCompiler,
    ]);
  },
});
