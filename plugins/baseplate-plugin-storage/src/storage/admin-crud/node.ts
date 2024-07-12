import {
  AdminCrudInputCompiler,
  ModelFieldUtils,
  PluginUtils,
  adminCrudInputCompilerSpec,
  createPlatformPluginExport,
} from '@halfdomelabs/project-builder-lib';

import { AdminCrudFileInputConfig } from './types';
import { StoragePluginDefinition } from '../core/schema/plugin-definition';
import { FileTransformerConfig } from '../transformers/types';

function buildFileTransformerCompiler(
  pluginId: string,
): AdminCrudInputCompiler<AdminCrudFileInputConfig> {
  return {
    name: 'file',
    compileInput(definition, { definitionContainer, model }) {
      const transformer = model.service?.transformers?.find(
        (t): t is FileTransformerConfig =>
          t.id === definition.modelRelation && t.type === 'file',
      );
      const relation = model.model.relations?.find(
        (r) => r.id === transformer?.fileRelationRef,
      );

      if (!relation) {
        throw new Error(
          `Could not find relation ${definition.modelRelation} in model ${model.name}`,
        );
      }

      const storageDefinition =
        PluginUtils.configByIdOrThrow<StoragePluginDefinition>(
          definitionContainer.definition,
          pluginId,
        );
      const category = storageDefinition.categories.find(
        (c) => c.usedByRelation === relation.foreignId,
      );

      if (!category) {
        throw new Error(
          `Could not find category for relation ${relation.foreignRelationName}`,
        );
      }
      const isOptional = ModelFieldUtils.isRelationOptional(model, relation);
      const relationName = definitionContainer.nameFromId(
        definition.modelRelation,
      );

      return {
        name: relationName,
        generator:
          '@halfdomelabs/baseplate-plugin-storage/react/admin-crud-file-input',
        label: definition.label,
        isOptional,
        category: category.name,
        modelRelation: relationName,
      };
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
