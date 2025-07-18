import {
  createPlatformPluginExport,
  modelTransformerSpec,
} from '@baseplate-dev/project-builder-lib';

import { createFileTransformerSchema } from './schema/file-transformer.schema.js';

export default createPlatformPluginExport({
  dependencies: {
    transformer: modelTransformerSpec,
  },
  exports: {},
  initialize: ({ transformer }) => {
    transformer.registerModelTransformer({
      name: 'file',
      createSchema: createFileTransformerSchema,
      getName(definitionContainer, definition) {
        return definitionContainer.nameFromId(definition.fileRelationRef);
      },
    });
    return {};
  },
});
