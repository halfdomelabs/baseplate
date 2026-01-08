import { createPluginModule } from '@baseplate-dev/project-builder-lib';
import { adminCrudColumnWebSpec } from '@baseplate-dev/project-builder-lib/web';

import { BUILT_IN_ADMIN_CRUD_COLUMN_WEB_CONFIGS } from '../routes/admin-sections.$appKey/-components/columns';

export const columnWebConfigsCoreModule = createPluginModule({
  name: 'column-web-configs',
  dependencies: {
    adminCrudColumnWeb: adminCrudColumnWebSpec,
  },
  initialize: ({ adminCrudColumnWeb }) => {
    adminCrudColumnWeb.columns.addMany(BUILT_IN_ADMIN_CRUD_COLUMN_WEB_CONFIGS);
  },
});
