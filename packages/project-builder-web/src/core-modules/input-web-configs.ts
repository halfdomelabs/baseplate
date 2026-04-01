import { createPluginModule } from '@baseplate-dev/project-builder-lib';
import { adminCrudInputWebSpec } from '@baseplate-dev/project-builder-lib/web';

import { BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS } from '../routes/packages/apps.$key/admin-sections/-components/inputs';

export const inputWebConfigsCoreModule = createPluginModule({
  name: 'input-web-configs',
  dependencies: {
    adminCrudInputWeb: adminCrudInputWebSpec,
  },
  initialize: ({ adminCrudInputWeb }) => {
    adminCrudInputWeb.inputs.addMany(BUILT_IN_ADMIN_CRUD_INPUT_WEB_CONFIGS);
  },
});
