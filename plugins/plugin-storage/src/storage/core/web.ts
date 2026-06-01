import {
  authModelsSpec,
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { StorageDefinitionEditor } from './components/storage-definition-editor.js';
import { createStoragePartialDefinition } from './schema/models.js';

import '../../styles.css';

const STORAGE_FEATURE_NAME = 'storage';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, StorageDefinitionEditor);
    pluginDefaults.builders.set(pluginKey, ({ draft, pluginStore }) => {
      const storageFeatureRef = FeatureUtils.ensureFeatureByNameRecursively(
        draft,
        STORAGE_FEATURE_NAME,
      );
      const authModels = pluginStore
        .use(authModelsSpec)
        .getAuthModelsOrThrow(draft);
      return {
        config: {
          storageFeatureRef,
          s3Adapters: [],
          fileCategories: [],
        },
        partialDef: createStoragePartialDefinition(
          STORAGE_FEATURE_NAME,
          authModels.user,
        ),
      };
    });
  },
});
