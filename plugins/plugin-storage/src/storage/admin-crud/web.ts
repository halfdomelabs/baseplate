import { createPlatformPluginExport } from '@baseplate-dev/project-builder-lib';
import { adminCrudInputWebSpec } from '@baseplate-dev/project-builder-lib/web';

import type { AdminCrudFileInputConfig } from './types.js';

import { AdminCrudFileInputForm } from './admin-crud-input-form.js';

import '../../styles.css';

export default createPlatformPluginExport({
  dependencies: {
    adminCrudInputWeb: adminCrudInputWebSpec,
  },
  exports: {},
  initialize: ({ adminCrudInputWeb }, { pluginKey }) => {
    adminCrudInputWeb.registerInputWebConfig<AdminCrudFileInputConfig>({
      name: 'file',
      pluginKey,
      label: 'File',
      getNewInput: () => ({ label: '', type: 'file', modelRelationRef: '' }),
      Form: AdminCrudFileInputForm,
    });
    return {};
  },
});
