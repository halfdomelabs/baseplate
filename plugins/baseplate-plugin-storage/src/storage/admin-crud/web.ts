import { createPlatformPluginExport } from '@halfdomelabs/project-builder-lib';
import { adminCrudInputWebSpec } from '@halfdomelabs/project-builder-lib/web';

import '../../index.css';

import type { AdminCrudFileInputConfig } from './types';

import { AdminCrudFileInputForm } from './AdminCrudInputForm';

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
