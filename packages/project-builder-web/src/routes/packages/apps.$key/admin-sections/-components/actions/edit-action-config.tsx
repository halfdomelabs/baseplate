import type { AdminCrudEditActionConfig } from '@baseplate-dev/project-builder-lib';

import { createAdminCrudActionWebConfig } from '@baseplate-dev/project-builder-lib/web';

export const adminCrudEditActionWebConfig =
  createAdminCrudActionWebConfig<AdminCrudEditActionConfig>({
    name: 'edit',
    pluginKey: undefined,
    label: 'Edit',
    isAvailableForModel: () => true,
    getNewAction: () => ({ type: 'edit', position: 'inline' }),
  });
