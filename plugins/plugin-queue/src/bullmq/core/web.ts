import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { BullmqDefinitionEditor } from './components/bullmq-definition-editor.js';

import '../../styles.css';

export default createPlatformPluginExport({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginKey }) => {
    webConfig.registerWebConfigComponent(pluginKey, BullmqDefinitionEditor);
    return {};
  },
});
