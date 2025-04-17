import {
  createPlatformPluginExport,
  modelTransformerSpec,
} from '@halfdomelabs/project-builder-lib';

import { fileTransformerSchema } from './types.js';

export default createPlatformPluginExport({
  dependencies: {
    transformer: modelTransformerSpec,
  },
  exports: {},
  initialize: ({ transformer }) => {
    transformer.registerModelTransformer({
      name: 'file',
      schema: fileTransformerSchema,
      getName(definitionContainer, definition) {
        return definitionContainer.nameFromId(definition.fileRelationRef);
      },
    });
    return {};
  },
});
