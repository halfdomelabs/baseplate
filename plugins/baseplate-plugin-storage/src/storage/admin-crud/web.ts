import { createPlatformPluginExport } from '@halfdomelabs/project-builder-lib';
import { adminCrudInputWebSpec } from '@halfdomelabs/project-builder-lib/web';

import '../../index.css';
import { AdminCrudFileInputForm } from './AdminCrudInputForm';
import { AdminCrudFileInputConfig } from './types';

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
      getNewInput: () => ({ label: '', type: 'file', modelRelation: '' }),
      Form: AdminCrudFileInputForm,
    });
    return {};
  },
});
