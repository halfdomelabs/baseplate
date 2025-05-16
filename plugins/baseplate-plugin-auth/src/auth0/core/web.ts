import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@halfdomelabs/project-builder-lib';

import { AuthDefinitionEditor } from './components/auth-definition-editor';

import '../../styles.css';

export default createPlatformPluginExport({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginId }) => {
    webConfig.registerWebConfigComponent(pluginId, AuthDefinitionEditor);
    return {};
  },
});
