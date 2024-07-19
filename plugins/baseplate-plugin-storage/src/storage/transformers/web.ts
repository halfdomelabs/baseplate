import {
  createPlatformPluginExport,
  modelTransformerEntityType,
} from '@halfdomelabs/project-builder-lib';
import { modelTransformerWebSpec } from '@halfdomelabs/project-builder-lib/web';

import '../../index.css';
import { FileTransformerForm } from './components/FileTransformerForm';
import { FileTransformerConfig } from './types';

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
      getNewTransformer: () => ({
        id: modelTransformerEntityType.generateNewId(),
        type: 'file',
        fileRelationRef: '',
      }),
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
