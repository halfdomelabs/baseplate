import {
  authModelsSpec,
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';
import {
  createWebAppSettingsWebConfig,
  webAppSchemaExtensionWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import { StorageDefinitionEditor } from './components/storage-definition-editor.js';
import { StorageWebAppSettingsForm } from './components/storage-web-app-settings-form.js';
import { createStoragePartialDefinition } from './schema/models.js';

import '../../styles.css';

const STORAGE_FEATURE_NAME = 'storage';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
    webAppSchemaExtensionWeb: webAppSchemaExtensionWebSpec,
  },
  initialize: (
    { webConfig, pluginDefaults, webAppSchemaExtensionWeb },
    { pluginKey },
  ) => {
    webConfig.components.set(pluginKey, StorageDefinitionEditor);
    webAppSchemaExtensionWeb.configs.set(
      pluginKey,
      createWebAppSettingsWebConfig({
        pluginKey,
        Form: StorageWebAppSettingsForm,
      }),
    );
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
