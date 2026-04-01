import { createPluginModule } from '@baseplate-dev/project-builder-lib';
import { adminCrudActionWebSpec } from '@baseplate-dev/project-builder-lib/web';

import { BUILT_IN_ADMIN_CRUD_ACTION_WEB_CONFIGS } from '../routes/packages/apps.$key/admin-sections/-components/actions';

export const actionWebConfigsCoreModule = createPluginModule({
  name: 'action-web-configs',
  dependencies: {
    adminCrudActionWeb: adminCrudActionWebSpec,
  },
  initialize: ({ adminCrudActionWeb }) => {
    adminCrudActionWeb.actions.addMany(BUILT_IN_ADMIN_CRUD_ACTION_WEB_CONFIGS);
  },
});
