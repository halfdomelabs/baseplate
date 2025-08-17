import type { AdminCrudDeleteActionConfig } from '@baseplate-dev/project-builder-lib';

import { createAdminCrudActionWebConfig } from '@baseplate-dev/project-builder-lib/web';

export const adminCrudDeleteActionWebConfig =
  createAdminCrudActionWebConfig<AdminCrudDeleteActionConfig>({
    name: 'delete',
    pluginKey: undefined,
    label: 'Delete',
    isAvailableForModel: () => true,
    getNewAction: () => ({ type: 'delete', position: 'dropdown' }),
  });
