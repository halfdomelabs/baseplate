import {
  createPlatformPluginExport,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import { adminCrudActionWebSpec } from '@baseplate-dev/project-builder-lib/web';

import type { LocalAuthPluginDefinition } from '../core/schema/plugin-definition.js';

export default createPlatformPluginExport({
  dependencies: {
    adminCrudActionWeb: adminCrudActionWebSpec,
  },
  exports: {},
  initialize: ({ adminCrudActionWeb }, { pluginKey }) => {
    adminCrudActionWeb.registerActionWebConfig({
      pluginKey,
      name: 'manage-roles',
      label: 'Manage Roles',
      isAvailableForModel: (definition, modelId) => {
        const pluginDefinition = PluginUtils.configByKeyOrThrow(
          definition,
          pluginKey,
        ) as LocalAuthPluginDefinition;
        return modelId === pluginDefinition.modelRefs.user;
      },
      getNewAction: () => ({ type: 'manage-roles', position: 'dropdown' }),
    });
    return {};
  },
});
