import type {
  ModelConfigInput,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import {
  createPluginModule,
  modelTransformerEntityType,
  ModelUtils,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import { modelTransformerWebSpec } from '@baseplate-dev/project-builder-lib/web';
import { constantCase } from 'es-toolkit';

import { STORAGE_MODELS } from '#src/storage/constants/model-names.js';

import type { StoragePluginDefinition } from '../core/schema/plugin-definition.js';
import type { FileTransformerDefinition } from './schema/file-transformer.schema.js';

import { FileTransformerForm } from './components/file-transformer-form.js';

import '../../styles.css';

function findNonTransformedFileRelations(
  projectContainer: ProjectDefinitionContainer,
  modelConfig: ModelConfigInput,
): string[] {
  const { transformers } = modelConfig.service ?? {};
  const fileTransformers = transformers?.filter(
    (transformer): transformer is FileTransformerDefinition =>
      transformer.type === 'file',
  );

  return (
    modelConfig.model.relations
      ?.filter(
        (relation) =>
          ModelUtils.byIdOrThrow(projectContainer.definition, relation.modelRef)
            .name === STORAGE_MODELS.file &&
          !fileTransformers?.some(
            (transformer) => transformer.fileRelationRef === relation.id,
          ),
      )
      .map((r) => r.id) ?? []
  );
}

export default createPluginModule({
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
        return (
          findNonTransformedFileRelations(projectContainer, modelConfig)
            .length > 0
        );
      },
      getNewTransformer: (projectContainer, modelConfig) => {
        const { definition } = projectContainer;
        const fileRelationIds = findNonTransformedFileRelations(
          projectContainer,
          modelConfig,
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
