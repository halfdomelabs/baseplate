import { createPluginModule } from '@baseplate-dev/project-builder-lib';
import { adminCrudInputWebSpec } from '@baseplate-dev/project-builder-lib/web';

import { AdminCrudFileInputForm } from './admin-crud-input-form.js';

import '../../styles.css';

export default createPluginModule({
  name: 'web',
  dependencies: {
    adminCrudInputWeb: adminCrudInputWebSpec,
  },
  initialize: ({ adminCrudInputWeb }, { pluginKey }) => {
    adminCrudInputWeb.inputs.add({
      name: 'file',
      pluginKey,
      label: 'File',
      getNewInput: () => ({ label: '', type: 'file', modelRelationRef: '' }),
      Form: AdminCrudFileInputForm,
    });
  },
});
