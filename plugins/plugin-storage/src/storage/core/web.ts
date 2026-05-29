import {
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { StorageDefinitionEditor } from './components/storage-definition-editor.js';

import '../../styles.css';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, StorageDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, ({ draft }) => {
      const storageFeatureRef = FeatureUtils.ensureFeatureByNameRecursively(
        draft,
        'storage',
      );
      return {
        storageFeatureRef,
        s3Adapters: [],
        fileCategories: [],
      };
    });
  },
});
