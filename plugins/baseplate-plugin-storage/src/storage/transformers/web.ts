import {
  ModelConfig,
  PluginUtils,
  ProjectDefinition,
  createPlatformPluginExport,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { modelTransformerWebSpec } from '@halfdomelabs/project-builder-lib/web';

import '../../index.css';
import { FileTransformerForm } from './components/FileTransformerForm';
import { FileTransformerConfig } from './types';
import { StoragePluginDefinition } from '../core/schema/plugin-definition';

function findNonTransformedFileRelations(
  definition: ProjectDefinition,
  modelConfig: ModelConfig,
  pluginId: string,
): string[] {
  const storageDefinition =
    PluginUtils.configByIdOrThrow<StoragePluginDefinition>(
      definition,
      pluginId,
    );
  const { transformers } = modelConfig.service ?? {};
  const fileTransformers = (transformers?.filter(
    (transformer) => transformer.type === 'file',
  ) ?? []) as FileTransformerConfig[];
  return (
    modelConfig.model.relations
      ?.filter(
        (relation) =>
          relation.modelName === storageDefinition.fileModelRef &&
          !fileTransformers.some(
            (transformer) => transformer.fileRelationRef === relation.id,
          ),
      )
      .map((r) => r.id) ?? []
  );
}

export default createPlatformPluginExport({
  dependencies: {
    transformerWeb: modelTransformerWebSpec,
  },
  exports: {},
  initialize: ({ transformerWeb }, { pluginId }) => {
    transformerWeb.registerTransformerWebConfig<FileTransformerConfig>({
      name: 'file',
      label: 'File',
      pluginId,
      Form: FileTransformerForm,
      allowNewTransformer(projectContainer, modelConfig) {
        const { definition } = projectContainer;
        return (
          findNonTransformedFileRelations(definition, modelConfig, pluginId)
            .length > 0
        );
      },
      getNewTransformer: (projectContainer, modelConfig) => {
        const { definition } = projectContainer;
        const fileRelationIds = findNonTransformedFileRelations(
          definition,
          modelConfig,
          pluginId,
        );
        return {
          id: modelTransformerEntityType.generateNewId(),
          type: 'file',
          fileRelationRef: fileRelationIds[0],
        };
      },
      getSummary: (definition, definitionContainer) => [
        {
          label: 'File Relation',
          description: definitionContainer.nameFromId(
            definition.fileRelationRef,
          ),
        },
      ],
    });
    return {};
  },
});
