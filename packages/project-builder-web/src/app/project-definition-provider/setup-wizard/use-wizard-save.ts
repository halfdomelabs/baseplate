import type {
  AppConfig,
  PluginMetadataWithPaths,
  ProjectDefinition,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

import {
  appEntityType,
  authRoleEntityType,
  FeatureUtils,
  libraryEntityType,
  PluginUtils,
} from '@baseplate-dev/project-builder-lib';
import { sortBy, startCase } from 'es-toolkit';
import { useCallback } from 'react';

import type { SetupWizardData } from './setup-wizard-schema.js';

const AUTH_PLUGIN_FQN = '@baseplate-dev/plugin-auth:auth';
const EMAIL_PLUGIN_FQN = '@baseplate-dev/plugin-email:email';
const QUEUE_PLUGIN_FQN = '@baseplate-dev/plugin-queue:queue';
const BULLMQ_PLUGIN_FQN = '@baseplate-dev/plugin-queue:bullmq';
const PG_BOSS_PLUGIN_FQN = '@baseplate-dev/plugin-queue:pg-boss';
const RATE_LIMIT_PLUGIN_FQN = '@baseplate-dev/plugin-rate-limit:rate-limit';
const STORAGE_PLUGIN_FQN = '@baseplate-dev/plugin-storage:storage';
const SENTRY_PLUGIN_FQN = '@baseplate-dev/plugin-observability:sentry';
const STRIPE_PLUGIN_FQN = '@baseplate-dev/plugin-payments:stripe';
const DEV_AGENTS_PLUGIN_FQN = '@baseplate-dev/plugin-ai:dev-agents';

const TRANSACTIONAL_LIB_TYPE = '@baseplate-dev/plugin-email/transactional-lib';

const AUTH_DEFAULT_ROLES = [
  {
    name: 'public',
    comment: 'All users (including unauthenticated and authenticated users)',
    builtIn: true,
    autoAssigned: true,
  },
  {
    name: 'user',
    comment: 'All authenticated users',
    builtIn: true,
    autoAssigned: true,
  },
  {
    name: 'system',
    comment: 'System processes without a user context, e.g. background jobs',
    builtIn: true,
    autoAssigned: true,
  },
  {
    name: 'admin',
    comment: 'Administrator with full access',
    builtIn: true,
    autoAssigned: false,
  },
] as const;

function findPlugin(
  plugins: PluginMetadataWithPaths[],
  fqn: string,
): PluginMetadataWithPaths | undefined {
  return plugins.find((p) => p.fullyQualifiedName === fqn);
}

/**
 * Builds the initial apps array for a brand-new project based on the wizard's
 * `enabledApps` selection. Mirrors the port-assignment logic in
 * `migration-023-assign-app-ports.ts` and `new-dialog.tsx`:
 * - backend → portOffset + 1
 * - web/admin (both `type: 'web'`) → portOffset + 30 + alphabeticalIndex
 *
 * The `admin` preset is a web app with `adminApp.enabled = true`.
 */
function buildInitialApps(
  enabledApps: SetupWizardData['enabledApps'],
  portOffset: number,
): AppConfig[] {
  const webNames: string[] = [];
  if (enabledApps.admin) webNames.push('admin');
  if (enabledApps.web) webNames.push('web');
  webNames.sort();

  const apps: AppConfig[] = [];

  if (enabledApps.backend) {
    apps.push({
      id: appEntityType.generateNewId(),
      name: 'backend',
      type: 'backend',
      devPort: portOffset + 1,
    } as AppConfig);
  }

  for (const webName of webNames) {
    const isAdmin = webName === 'admin';
    apps.push({
      id: appEntityType.generateNewId(),
      name: webName,
      type: 'web',
      devPort: portOffset + 30 + webNames.indexOf(webName),
      title: startCase(webName),
      description: isAdmin ? 'Admin panel' : 'Web application',
      includeAuth: false,
      includeUploadComponents: false,
      enableSubscriptions: false,
      adminApp: {
        enabled: isAdmin,
        pathPrefix: '/admin',
        allowedRoles: [],
        sections: [],
      },
    });
  }

  return sortBy(apps, [(app) => app.name]);
}

function enablePluginIfAvailable(
  draft: ProjectDefinition,
  plugins: PluginMetadataWithPaths[],
  fqn: string,
  config: unknown,
  definitionContainer: ProjectDefinitionContainer,
): void {
  const plugin = findPlugin(plugins, fqn);
  if (plugin) {
    PluginUtils.setPluginConfig(draft, plugin, config, definitionContainer);
  }
}

interface UseWizardSaveOptions {
  plugins: PluginMetadataWithPaths[];
  definitionContainer: ProjectDefinitionContainer;
  saveDefinition: (
    setter: (draft: ProjectDefinition) => void,
  ) => Promise<unknown>;
}

interface UseWizardSaveResult {
  saveWithPlugins: (data: SetupWizardData) => Promise<void>;
  saveBasicsOnly: (data: SetupWizardData) => Promise<void>;
}

export function useWizardSave({
  plugins,
  definitionContainer,
  saveDefinition,
}: UseWizardSaveOptions): UseWizardSaveResult {
  const saveBasicsOnly = useCallback(
    async (data: SetupWizardData) => {
      await saveDefinition((draft) => {
        draft.settings.general = {
          name: data.name,
          portOffset: data.portOffset,
          packageScope: '',
        };
        draft.apps = buildInitialApps(data.enabledApps, data.portOffset);
        draft.isInitialized = true;
      });
    },
    [saveDefinition],
  );

  const saveWithPlugins = useCallback(
    async (data: SetupWizardData) => {
      await saveDefinition((draft) => {
        // 1. Set general settings
        draft.settings.general = {
          name: data.name,
          portOffset: data.portOffset,
          packageScope: '',
        };
        draft.apps = buildInitialApps(data.enabledApps, data.portOffset);
        draft.isInitialized = true;

        // Track which dependency plugins we need
        let needsQueue = false;
        let needsRateLimit = false;

        // 2. Configure auth if enabled
        if (data.enableAuth) {
          const authPlugin = findPlugin(plugins, AUTH_PLUGIN_FQN);
          const implFqn = `@baseplate-dev/plugin-auth:${data.authMethod}`;
          const implPlugin = findPlugin(plugins, implFqn);

          if (authPlugin && implPlugin) {
            const authFeatureRef = FeatureUtils.ensureFeatureByNameRecursively(
              draft,
              'accounts/auth',
            );
            const accountsFeatureRef =
              FeatureUtils.ensureFeatureByNameRecursively(
                draft,
                'accounts/users',
              );

            const roles = AUTH_DEFAULT_ROLES.map((role) => ({
              ...role,
              id: authRoleEntityType.generateNewId(),
            }));

            PluginUtils.setPluginConfig(
              draft,
              authPlugin,
              {
                implementationPluginKey: implPlugin.key,
                authFeatureRef,
                accountsFeatureRef,
                roles,
              },
              definitionContainer,
            );

            // Enable the implementation plugin
            PluginUtils.setPluginConfig(
              draft,
              implPlugin,
              {},
              definitionContainer,
            );

            if (data.authMethod === 'local-auth') {
              needsQueue = true;
              needsRateLimit = true;
            }
          }
        }

        // 3. Configure email if enabled
        if (data.enableEmail) {
          const emailPlugin = findPlugin(plugins, EMAIL_PLUGIN_FQN);
          const implFqn = `@baseplate-dev/plugin-email:${data.emailProvider}`;
          const implPlugin = findPlugin(plugins, implFqn);

          if (emailPlugin && implPlugin) {
            PluginUtils.setPluginConfig(
              draft,
              emailPlugin,
              { implementationPluginKey: implPlugin.key },
              definitionContainer,
            );

            // Enable the implementation plugin
            PluginUtils.setPluginConfig(
              draft,
              implPlugin,
              {},
              definitionContainer,
            );

            // Auto-create transactional email library
            const hasTransactionalLib = draft.libraries.some(
              (lib) => lib.type === TRANSACTIONAL_LIB_TYPE,
            );
            if (!hasTransactionalLib) {
              const existingNames = new Set(
                draft.libraries.map((lib) => lib.name),
              );
              let libName = 'transactional';
              let counter = 2;
              while (existingNames.has(libName)) {
                libName = `transactional-${counter}`;
                counter++;
              }

              draft.libraries = sortBy(
                [
                  ...draft.libraries,
                  {
                    id: libraryEntityType.generateNewId(),
                    name: libName,
                    type: TRANSACTIONAL_LIB_TYPE,
                  },
                ],
                [(lib) => lib.name],
              );
            }

            needsQueue = true;
          }
        }

        // 4. Enable queue with chosen implementation if any feature needs it
        //    or the user explicitly toggled it on.
        if (needsQueue || data.enableStorage || data.enableQueue) {
          const queueImplFqn =
            data.queueImplementation === 'bullmq'
              ? BULLMQ_PLUGIN_FQN
              : PG_BOSS_PLUGIN_FQN;

          const queuePlugin = findPlugin(plugins, QUEUE_PLUGIN_FQN);
          const queueImplPlugin = findPlugin(plugins, queueImplFqn);

          if (queuePlugin && queueImplPlugin) {
            PluginUtils.setPluginConfig(
              draft,
              queuePlugin,
              { implementationPluginKey: queueImplPlugin.key },
              definitionContainer,
            );
            PluginUtils.setPluginConfig(
              draft,
              queueImplPlugin,
              {},
              definitionContainer,
            );
          }

          // Enable Redis infrastructure when BullMQ is selected
          if (data.queueImplementation === 'bullmq') {
            draft.settings.infrastructure = {
              ...draft.settings.infrastructure,
              redis: { enabled: true },
            };
          }
        }

        if (needsRateLimit) {
          enablePluginIfAvailable(
            draft,
            plugins,
            RATE_LIMIT_PLUGIN_FQN,
            {},
            definitionContainer,
          );
        }

        // 5. Enable additional plugins
        if (data.enableStorage) {
          enablePluginIfAvailable(
            draft,
            plugins,
            STORAGE_PLUGIN_FQN,
            {},
            definitionContainer,
          );
        }

        if (data.enableObservability) {
          enablePluginIfAvailable(
            draft,
            plugins,
            SENTRY_PLUGIN_FQN,
            {},
            definitionContainer,
          );
        }

        if (data.enablePayments) {
          enablePluginIfAvailable(
            draft,
            plugins,
            STRIPE_PLUGIN_FQN,
            {},
            definitionContainer,
          );
        }

        if (data.enableAi) {
          enablePluginIfAvailable(
            draft,
            plugins,
            DEV_AGENTS_PLUGIN_FQN,
            {},
            definitionContainer,
          );
        }
      });
    },
    [plugins, definitionContainer, saveDefinition],
  );

  return { saveWithPlugins, saveBasicsOnly };
}
