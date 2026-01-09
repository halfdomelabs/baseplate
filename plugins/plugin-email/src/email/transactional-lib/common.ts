import {
  createPluginModule,
  libraryTypeSpec,
} from '@baseplate-dev/project-builder-lib';

import { transactionalLibDefinitionSchemaEntry } from './schema/transactional-lib-definition.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    libraryType: libraryTypeSpec,
  },
  initialize: ({ libraryType }) => {
    libraryType.schemaCreators.add(transactionalLibDefinitionSchemaEntry);
  },
});
