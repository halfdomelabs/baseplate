import type { AdminCrudInputCompiler } from '@baseplate-dev/project-builder-lib';

import {
  adminCrudInputCompilerSpec,
  createPluginModule,
  ModelFieldUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';

import { adminCrudFileInputGenerator } from '#src/generators/react/admin-crud-file-input/index.js';

import type { StoragePluginDefinition } from '../core/schema/plugin-definition.js';
import type { FileTransformerDefinition } from '../transformers/schema/file-transformer.schema.js';
import type { AdminCrudFileInputDefinition } from './types.js';

function buildFileTransformerCompiler(
  pluginKey: string,
): AdminCrudInputCompiler<AdminCrudFileInputDefinition> {
  return {
    name: 'file',
    compileInput(definition, { order, definitionContainer, model }) {
      const transformer = model.service.transformers.find(
        (t): t is FileTransformerDefinition =>
          t.id === definition.modelRelationRef && t.type === 'file',
      );
      const relation = model.model.relations.find(
        (r) => r.id === transformer?.fileRelationRef,
      );

      if (!relation) {
        throw new Error(
          `Could not find relation ${definition.modelRelationRef} in model ${model.name}`,
        );
      }

      if (!transformer?.categoryRef) {
        throw new Error(
          `Could not find category for relation ${relation.foreignRelationName}`,
        );
      }
      const categoryName = definitionContainer.nameFromId(
        transformer.categoryRef,
      );
      const isOptional = ModelFieldUtils.isRelationOptional(model, relation);
      const relationName = definitionContainer.nameFromId(
        definition.modelRelationRef,
      );

      const storage = PluginUtils.configByKeyOrThrow(
        definitionContainer.definition,
        pluginKey,
      ) as StoragePluginDefinition;
      const category = storage.fileCategories.find(
        (c) => c.id === transformer.categoryRef,
      );

      return adminCrudFileInputGenerator({
        order,
        label: definition.label,
        isOptional,
        category: categoryName,
        allowedMimeTypes: category?.allowedMimeTypes,
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
  initialize: ({ adminCrudInputCompiler }, { pluginKey }) => {
    adminCrudInputCompiler.inputs.add(buildFileTransformerCompiler(pluginKey));
  },
});
