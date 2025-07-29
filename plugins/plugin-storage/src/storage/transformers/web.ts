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
import { constantCase } from 'es-toolkit';

import type { StoragePluginDefinition } from '../core/schema/plugin-definition.js';
import type { FileTransformerDefinition } from './schema/file-transformer.schema.js';

import { FileTransformerForm } from './components/file-transformer-form.js';

import '../../styles.css';

function findNonTransformedFileRelations(
  definition: ProjectDefinition,
  modelConfig: ModelConfigInput,
  pluginKey: string,
): string[] {
  const storageDefinition = PluginUtils.configByKeyOrThrow(
    definition,
    pluginKey,
  ) as StoragePluginDefinition;
  const { transformers } = modelConfig.service ?? {};
  const fileTransformers = transformers?.filter(
    (transformer): transformer is FileTransformerDefinition =>
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
  initialize: ({ transformerWeb }, { pluginKey }) => {
    transformerWeb.registerTransformerWebConfig<FileTransformerDefinition>({
      name: 'file',
      label: 'File',
      description: 'Validates and associates file ID to field',
      instructions: 'Select a file relation to transform',
      pluginKey,
      Form: FileTransformerForm,
      allowNewTransformer(projectContainer, modelConfig) {
        const { definition } = projectContainer;
        return (
          findNonTransformedFileRelations(definition, modelConfig, pluginKey)
            .length > 0
        );
      },
      getNewTransformer: (projectContainer, modelConfig) => {
        const { definition } = projectContainer;
        const fileRelationIds = findNonTransformedFileRelations(
          definition,
          modelConfig,
          pluginKey,
        );
        const fileRelationId = fileRelationIds[0];
        const relation = modelConfig.model.relations?.find(
          (r) => r.id === fileRelationId,
        );
        if (!relation) {
          throw new Error(`Could not find relation ${fileRelationId}`);
        }
        const storageDefinition = PluginUtils.configByKeyOrThrow(
          definition,
          pluginKey,
        ) as StoragePluginDefinition;
        return {
          id: modelTransformerEntityType.generateNewId(),
          type: 'file' as const,
          fileRelationRef: fileRelationIds[0],
          category: {
            name: constantCase(relation.foreignRelationName),
            maxFileSizeMb: 20,
            authorize: {
              uploadRoles: ['user'],
            },
            adapterRef: storageDefinition.s3Adapters[0]?.id ?? '',
          },
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
