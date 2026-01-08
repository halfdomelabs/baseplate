import {
  adminCrudInputSpec,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { createAdminCrudFileInputSchema } from './types.js';

export default createPluginModule({
  dependencies: {
    adminCrudInput: adminCrudInputSpec,
  },
  exports: {},
  initialize: ({ adminCrudInput }) => {
    adminCrudInput.registerAdminCrudInput({
      name: 'file',
      createSchema: createAdminCrudFileInputSchema,
    });
    return {};
  },
});
