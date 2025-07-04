import type {
  ModelConfigInput,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';

import {
  createPlatformPluginExport,
  modelTransformerEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import { modelTransformerWebSpec } from '@baseplate-dev/project-builder-lib/web';

import type { StoragePluginDefinition } from '../core/schema/plugin-definition.js';
import type { FileTransformerConfig } from './types.js';

import { FileTransformerForm } from './components/file-transformer-form.js';

import '../../styles.css';

function findNonTransformedFileRelations(
  definition: ProjectDefinition,
  modelConfig: ModelConfigInput,
  pluginId: string,
): string[] {
  const storageDefinition = PluginUtils.configByIdOrThrow(
    definition,
    pluginId,
  ) as StoragePluginDefinition;
  const { transformers } = modelConfig.service ?? {};
  const fileTransformers = transformers?.filter(
    (transformer): transformer is FileTransformerConfig =>
      transformer.type === 'file',
  );
  return (
    modelConfig.model.relations
      ?.filter(
        (relation) =>
          relation.modelRef === storageDefinition.modelRefs.file &&
          !fileTransformers?.some(
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
      description: 'Validates and associates file ID to field',
      instructions: 'Select a file relation to transform',
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
