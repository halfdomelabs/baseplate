import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { PlaceholderAuthDefinitionEditor } from './components/placeholder-auth-definition-editor.js';

import '../../styles.css';

export default createPlatformPluginExport({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginId }) => {
    webConfig.registerWebConfigComponent(
      pluginId,
      PlaceholderAuthDefinitionEditor,
    );
    return {};
  },
});
