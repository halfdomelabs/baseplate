import {
  adminCrudInputSpec,
  createPlatformPluginExport,
} from '@halfdomelabs/project-builder-lib';

import { adminCrudFileInputSchema } from './types.js';

export default createPlatformPluginExport({
  dependencies: {
    adminCrudInput: adminCrudInputSpec,
  },
  exports: {},
  initialize: ({ adminCrudInput }) => {
    adminCrudInput.registerAdminCrudInput({
      name: 'file',
      schema: adminCrudFileInputSchema,
    });
    return {};
  },
});
