import {
  createModelTransformerType,
  createPluginModule,
  modelTransformerSpec,
} from '@baseplate-dev/project-builder-lib';

import { createFileTransformerSchema } from './schema/file-transformer.schema.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    transformer: modelTransformerSpec,
  },
  initialize: ({ transformer }) => {
    transformer.transformers.add(
      createModelTransformerType({
        name: 'file',
        createSchema: createFileTransformerSchema,
        getName(definitionContainer, definition) {
          return definitionContainer.nameFromId(definition.fileRelationRef);
        },
      }),
    );
  },
});
