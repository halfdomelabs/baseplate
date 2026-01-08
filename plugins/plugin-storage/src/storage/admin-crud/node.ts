import type { AdminCrudInputCompiler } from '@baseplate-dev/project-builder-lib';

import {
  adminCrudInputCompilerSpec,
  createPluginModule,
  ModelFieldUtils,
} from '@baseplate-dev/project-builder-lib';

import { adminCrudFileInputGenerator } from '#src/generators/react/admin-crud-file-input/index.js';

import type { FileTransformerDefinition } from '../transformers/schema/file-transformer.schema.js';
import type { AdminCrudFileInputDefinition } from './types.js';

function buildFileTransformerCompiler(): AdminCrudInputCompiler<AdminCrudFileInputDefinition> {
  return {
    name: 'file',
    compileInput(definition, { order, definitionContainer, model }) {
      const transformer = model.service.transformers.find(
        (t): t is FileTransformerDefinition =>
          t.id === definition.modelRelationRef && t.type === 'file',
      );
      const relation = model.model.relations?.find(
        (r) => r.id === transformer?.fileRelationRef,
      );

      if (!relation) {
        throw new Error(
          `Could not find relation ${definition.modelRelationRef} in model ${model.name}`,
        );
      }

      const category = transformer?.category;

      if (!category) {
        throw new Error(
          `Could not find category for relation ${relation.foreignRelationName}`,
        );
      }
      const isOptional = ModelFieldUtils.isRelationOptional(model, relation);
      const relationName = definitionContainer.nameFromId(
        definition.modelRelationRef,
      );

      return adminCrudFileInputGenerator({
        order,
        label: definition.label,
        isOptional,
        category: category.name,
        modelRelation: relationName,
      });
    },
  };
}

export default createPluginModule({
  name: 'node',
  dependencies: {
    adminCrudInputCompiler: adminCrudInputCompilerSpec,
  },
  initialize: ({ adminCrudInputCompiler }) => {
    adminCrudInputCompiler.inputs.add(buildFileTransformerCompiler());
  },
});
