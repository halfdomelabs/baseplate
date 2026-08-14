import {
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';
import {
  createWebAppSettingsWebConfig,
  webAppSchemaExtensionWebSpec,
} from '@baseplate-dev/project-builder-lib/web';

import { LocalAuthDefinitionEditor } from './components/local-auth-definition-editor.js';
import { LocalAuthWebAppSettingsForm } from './components/local-auth-web-app-settings-form.js';
import { createLocalAuthPartialDefinition } from './schema/models.js';

import '../../styles.css';

const AUTH_FEATURE_NAME = 'accounts/auth';
const ACCOUNTS_FEATURE_NAME = 'accounts/users';

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
    webConfig.components.set(pluginKey, LocalAuthDefinitionEditor);
    webAppSchemaExtensionWeb.configs.set(
      pluginKey,
      createWebAppSettingsWebConfig({
        pluginKey,
        Form: LocalAuthWebAppSettingsForm,
      }),
    );
    pluginDefaults.builders.set(pluginKey, ({ draft }) => {
      // Idempotent with the parent auth builder, which also ensures these.
      FeatureUtils.ensureFeatureByNameRecursively(draft, AUTH_FEATURE_NAME);
      FeatureUtils.ensureFeatureByNameRecursively(draft, ACCOUNTS_FEATURE_NAME);
      return {
        config: {},
        partialDef: createLocalAuthPartialDefinition(
          AUTH_FEATURE_NAME,
          ACCOUNTS_FEATURE_NAME,
        ),
      };
    });
  },
});
