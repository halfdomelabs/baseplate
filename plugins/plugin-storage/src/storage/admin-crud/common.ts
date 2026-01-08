import {
  adminCrudInputSpec,
  createPluginModule,
} from '@baseplate-dev/project-builder-lib';

import { createAdminCrudFileInputSchema } from './types.js';

export default createPluginModule({
  name: 'common',
  dependencies: {
    adminCrudInput: adminCrudInputSpec,
  },
  initialize: ({ adminCrudInput }) => {
    adminCrudInput.inputs.add({
      name: 'file',
      createSchema: createAdminCrudFileInputSchema,
    });
  },
});
