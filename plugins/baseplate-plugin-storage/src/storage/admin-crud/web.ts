import { createPlatformPluginExport } from '@baseplate-dev/project-builder-lib';
import { adminCrudInputWebSpec } from '@baseplate-dev/project-builder-lib/web';

import type { AdminCrudFileInputConfig } from './types.js';

import { AdminCrudFileInputForm } from './AdminCrudInputForm.js';

import '../../styles.css';

export default createPlatformPluginExport({
  dependencies: {
    adminCrudInputWeb: adminCrudInputWebSpec,
  },
  exports: {},
  initialize: ({ adminCrudInputWeb }, { pluginId }) => {
    adminCrudInputWeb.registerInputWebConfig<AdminCrudFileInputConfig>({
      name: 'file',
      pluginId,
      label: 'File',
      getNewInput: () => ({ label: '', type: 'file', modelRelationRef: '' }),
      Form: AdminCrudFileInputForm,
    });
    return {};
  },
});
