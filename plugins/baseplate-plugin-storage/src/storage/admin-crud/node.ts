import type { AdminCrudInputCompiler } from '@halfdomelabs/project-builder-lib';

import {
  adminCrudInputCompilerSpec,
  createPlatformPluginExport,
  ModelFieldUtils,
  PluginUtils,
} from '@halfdomelabs/project-builder-lib';

import { adminCrudFileInputGenerator } from '@src/generators/react/admin-crud-file-input/admin-crud-file-input.generator';

import type { StoragePluginDefinition } from '../core/schema/plugin-definition';
import type { FileTransformerConfig } from '../transformers/types';
import type { AdminCrudFileInputConfig } from './types';

function buildFileTransformerCompiler(
  pluginId: string,
): AdminCrudInputCompiler<AdminCrudFileInputConfig> {
  return {
    name: 'file',
    compileInput(definition, { order, definitionContainer, model }) {
      const transformer = model.service.transformers.find(
        (t): t is FileTransformerConfig =>
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

      const storageDefinition = PluginUtils.configByIdOrThrow(
        definitionContainer.definition,
        pluginId,
      ) as StoragePluginDefinition;
      const category = storageDefinition.categories.find(
        (c) => c.usedByRelationRef === relation.foreignId,
      );

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

export default createPlatformPluginExport({
  dependencies: {
    adminCrudInputCompiler: adminCrudInputCompilerSpec,
  },
  exports: {},
  initialize: ({ adminCrudInputCompiler }, { pluginId }) => {
    adminCrudInputCompiler.registerCompiler(
      buildFileTransformerCompiler(pluginId),
    );
    return {};
  },
});
