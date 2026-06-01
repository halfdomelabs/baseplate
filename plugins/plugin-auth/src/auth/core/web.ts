import {
  createPluginModule,
  FeatureUtils,
  pluginDefaultsSpec,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { createDefaultAuthRoles } from '#src/auth/core/schema/roles/constants.js';

import { AuthDefinitionEditor } from './components/auth-definition-editor.js';

import '../../styles.css';

const AUTH_FEATURE_NAME = 'accounts/auth';
const ACCOUNTS_FEATURE_NAME = 'accounts/users';
const AUTH_IMPL_FQN_PREFIX = '@baseplate-dev/plugin-auth:';
const PARENT_AUTH_FQN = '@baseplate-dev/plugin-auth:auth';

export default createPluginModule({
  name: 'web',
  dependencies: {
    webConfig: webConfigSpec,
    pluginDefaults: pluginDefaultsSpec,
  },
  initialize: ({ webConfig, pluginDefaults }, { pluginKey }) => {
    webConfig.components.set(pluginKey, AuthDefinitionEditor);
    pluginDefaults.builders.set(
      pluginKey,
      ({ draft, enabledPluginFqns, findPluginMetadataByFqn }) => {
        const authFeatureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draft,
          AUTH_FEATURE_NAME,
        );
        const accountsFeatureRef = FeatureUtils.ensureFeatureByNameRecursively(
          draft,
          ACCOUNTS_FEATURE_NAME,
        );

        // The auth parent plugin needs an implementation chosen by the caller
        // (local-auth / better-auth / placeholder-auth). Pick whichever impl
        // plugin under `@baseplate-dev/plugin-auth:` is also being enabled.
        const implFqn = [...enabledPluginFqns].find(
          (fqn) =>
            fqn.startsWith(AUTH_IMPL_FQN_PREFIX) && fqn !== PARENT_AUTH_FQN,
        );
        if (!implFqn) {
          throw new Error(
            'No auth implementation plugin enabled. Add an auth implementation (e.g. local-auth or better-auth) to the enabled plugins.',
          );
        }
        const implPlugin = findPluginMetadataByFqn(implFqn);
        if (!implPlugin) {
          throw new Error(
            `Auth implementation plugin ${implFqn} is enabled but its metadata could not be resolved.`,
          );
        }

        return {
          config: {
            implementationPluginKey: implPlugin.key,
            authFeatureRef,
            accountsFeatureRef,
            roles: createDefaultAuthRoles(),
          },
        };
      },
    );
  },
});
