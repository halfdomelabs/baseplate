import {
  createPluginModule,
  libraryTypeSpec,
} from '@baseplate-dev/project-builder-lib';

import { transactionalLibWebConfig } from './components/transactional-lib-edit.js';

import '#src/styles.css';

export default createPluginModule({
  name: 'web',
  dependencies: {
    libraryType: libraryTypeSpec,
  },
  initialize: ({ libraryType }) => {
    libraryType.webConfigs.add(transactionalLibWebConfig);
  },
});
