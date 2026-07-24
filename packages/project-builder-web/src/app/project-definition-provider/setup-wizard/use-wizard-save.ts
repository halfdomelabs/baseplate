import type {
  AppConfig,
  PluginMetadataWithPaths,
  ProjectDefinition,
} from '@baseplate-dev/project-builder-lib';

import {
  appEntityType,
  createDefinitionSchemaParserContext,
  createPluginImplementationStoreWithNewPlugins,
  createPluginSpecStore,
  createProjectDefinitionSchema,
  FeatureUtils,
  libraryEntityType,
  mergeDefinitionContainer,
  pluginDefaultsSpec,
  PluginUtils,
  ProjectDefinitionContainer,
  serializeSchema,
} from '@baseplate-dev/project-builder-lib';
import { sortBy, startCase } from 'es-toolkit';
import { useCallback } from 'react';

import type { SetupWizardData } from './setup-wizard-schema.js';

import {
  AUTH_PLUGIN_FQN,
  BULLMQ_PLUGIN_FQN,
  DEV_AGENTS_PLUGIN_FQN,
  EMAIL_PLUGIN_FQN,
  PG_BOSS_PLUGIN_FQN,
  QUEUE_PLUGIN_FQN,
  RATE_LIMIT_PLUGIN_FQN,
  SENTRY_PLUGIN_FQN,
  STORAGE_PLUGIN_FQN,
  STRIPE_PLUGIN_FQN,
} from './plugin-fqns.js';

const TRANSACTIONAL_LIB_TYPE = '@baseplate-dev/plugin-email/transactional-lib';
const EMAIL_FEATURE_NAME = 'emails';

function findPlugin(
  plugins: PluginMetadataWithPaths[],
  fqn: string,
): PluginMetadataWithPaths | undefined {
  return plugins.find((p) => p.fullyQualifiedName === fqn);
}

/**
 * Returns a fresh `ProjectDefinitionContainer` whose `schema` reflects the
 * plugins currently in `staleContainer.definition.plugins`.
 *
 * `mergeDefinitionContainer` reuses `staleContainer.schema` for its serialize
 * step. When the wizard adds a plugin via `setPluginConfig` mid-flow, the
 * stale schema doesn't know about the new plugin's config schema — ref fields
 * (e.g. `authFeatureRef`) aren't recognised and end up as raw ID strings in
 * the serialized output, which then fail to deserialize as names. Rebuilding
 * with a fresh schema fixes that.
 *
 * Builds the schema the same way `ProjectDefinitionContainer.fromSerializedConfig`
 * does internally, but starts from a parsed definition so we can keep the
 * mutations we just made.
 */
function rebuildContainerWithFreshSchema(
  staleContainer: ProjectDefinitionContainer,
  originalContainer: ProjectDefinitionContainer,
): ProjectDefinitionContainer {
  const { parserContext } = originalContainer;
  const freshPluginStore = createPluginSpecStore(
    parserContext.pluginStore,
    staleContainer.definition,
  );
  const freshSchema = createProjectDefinitionSchema(
    createDefinitionSchemaParserContext({ plugins: freshPluginStore }),
  );
  const serialized = serializeSchema(freshSchema, staleContainer.definition);
  return ProjectDefinitionContainer.fromSerializedConfig(
    serialized,
    parserContext,
  );
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
export function buildInitialApps(
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
      type: 'backend' as const,
      devPort: portOffset + 1,
    });
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

/**
 * Result of running plugin defaults builders in the pre-save phase.
 *
 * `seededDefinition` is a fully-merged project definition that already contains
 * every plugin entry, feature, and model the builders produced. The wizard
 * plants this into the draft via `Object.assign` *before* applying its other
 * mutations (apps, general settings, email/queue configs) so the rate-limit
 * and storage tables land alongside the plugin configs in a single save — no
 * follow-up "Apply fix" warning.
 *
 * `undefined` when no builder was invoked.
 */
interface PluginDefaultsResults {
  seededDefinition: ProjectDefinition | undefined;
}

/**
 * Runs each registered plugin defaults builder once. Composes their
 * `partialDef` returns sequentially via `mergeDefinitionContainer` so later
 * builders see earlier merges (e.g. storage's File model can reference the
 * already-seeded User model).
 *
 * Builders may also mutate the working container's `definition.features`
 * directly via `FeatureUtils.ensureFeatureByNameRecursively` so they can embed
 * the new feature's ID in their config payload. That mutation is included in
 * the next merge because `mergeDefinitionContainer` serializes the current
 * definition.
 */
function runPluginDefaultsBuilders(
  plugins: PluginMetadataWithPaths[],
  fqns: readonly string[],
  definitionContainer: ProjectDefinitionContainer,
  enabledPluginFqns: ReadonlySet<string>,
): PluginDefaultsResults {
  const allEnabledMetadatas = [...enabledPluginFqns]
    .map((fqn) => findPlugin(plugins, fqn))
    .filter((p): p is PluginMetadataWithPaths => !!p);

  // Build a transient spec store that includes every about-to-be-enabled
  // plugin's modules so cross-plugin specs (e.g. `authModelsSpec`) resolve
  // even before those plugins are in `draft.plugins`.
  const pluginSpecStore = createPluginImplementationStoreWithNewPlugins(
    definitionContainer.parserContext.pluginStore,
    allEnabledMetadatas,
    definitionContainer.definition,
  );
  const buildersByKey = pluginSpecStore.use(pluginDefaultsSpec).builders;

  let workingContainer = definitionContainer;
  let anyMutation = false;

  for (const fqn of fqns) {
    const plugin = findPlugin(plugins, fqn);
    if (!plugin) continue;
    const builder = buildersByKey.get(plugin.key);
    const result = builder
      ? builder({
          draft: workingContainer.definition,
          pluginStore: pluginSpecStore,
          enabledPluginFqns,
          findPluginMetadataByFqn: (lookupFqn) =>
            findPlugin(plugins, lookupFqn),
        })
      : { config: {} as unknown };

    // Attach the plugin config to `workingContainer.definition.plugins`
    // *before* merging the partial def below. The partial def's models may
    // reference role names defined on the plugin's config (e.g. auth's
    // `admin`) and the merge resolves those names to IDs by walking the
    // current definition.
    PluginUtils.setPluginConfig(
      workingContainer.definition,
      plugin,
      result.config,
      workingContainer,
    );
    anyMutation = true;

    // Rebuild the container so its `schema` reflects the just-added plugin's
    // config schema. Without this, the next `mergeDefinitionContainer` call
    // would serialize the new plugin's config with a stale schema that doesn't
    // recognise its ref fields (like `authFeatureRef`) — leaving raw IDs in
    // the serialized form that fail to deserialize back.
    workingContainer = rebuildContainerWithFreshSchema(
      workingContainer,
      definitionContainer,
    );

    if (result.partialDef) {
      workingContainer = mergeDefinitionContainer(
        workingContainer,
        result.partialDef,
      );
    }
  }

  return {
    seededDefinition: anyMutation ? workingContainer.definition : undefined,
  };
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
      // Compute the FQNs we intend to enable so plugin defaults builders can
      // branch on what else is being turned on (e.g. payments deciding whether
      // to enable billing).
      // Determine queue requirement before building enabledPluginFqns so that
      // both the FQN set and the inline config block use the same rule.
      const needsQueue =
        (data.enableAuth && data.authMethod === 'local-auth') ||
        data.enableEmail ||
        data.enableStorage ||
        data.enableQueue;

      const enabledPluginFqns = new Set<string>();
      if (data.enableAuth) {
        enabledPluginFqns.add(AUTH_PLUGIN_FQN);
        enabledPluginFqns.add(`@baseplate-dev/plugin-auth:${data.authMethod}`);
        if (data.authMethod === 'local-auth') {
          enabledPluginFqns.add(RATE_LIMIT_PLUGIN_FQN);
        }
      }
      if (data.enableEmail) {
        enabledPluginFqns.add(EMAIL_PLUGIN_FQN);
        enabledPluginFqns.add(
          `@baseplate-dev/plugin-email:${data.emailProvider}`,
        );
      }
      if (needsQueue) {
        enabledPluginFqns.add(QUEUE_PLUGIN_FQN);
        enabledPluginFqns.add(
          data.queueImplementation === 'bullmq'
            ? BULLMQ_PLUGIN_FQN
            : PG_BOSS_PLUGIN_FQN,
        );
      }
      if (data.enableStorage) enabledPluginFqns.add(STORAGE_PLUGIN_FQN);
      if (data.enableObservability) enabledPluginFqns.add(SENTRY_PLUGIN_FQN);
      if (data.enablePayments) enabledPluginFqns.add(STRIPE_PLUGIN_FQN);
      if (data.enableAi) enabledPluginFqns.add(DEV_AGENTS_PLUGIN_FQN);

      // Pre-save: run each plugin's defaults builder to collect both the config
      // payload and any `partialDef` that scaffolds the plugin's required
      // models. We compose partial defs sequentially so later builders see
      // earlier merges (e.g. storage needs the auth User model to land its
      // File relation). Order matters here: parent auth runs first so the
      // accounts features exist before its impl's partial def references them,
      // and auth's impl runs before storage so the User model lands first.
      const authImplFqn = data.enableAuth
        ? `@baseplate-dev/plugin-auth:${data.authMethod}`
        : undefined;
      const builderFqnsInOrder = [
        AUTH_PLUGIN_FQN,
        authImplFqn,
        RATE_LIMIT_PLUGIN_FQN,
        STORAGE_PLUGIN_FQN,
        SENTRY_PLUGIN_FQN,
        STRIPE_PLUGIN_FQN,
        DEV_AGENTS_PLUGIN_FQN,
      ].filter(
        (fqn): fqn is string => fqn !== undefined && enabledPluginFqns.has(fqn),
      );
      const defaults = runPluginDefaultsBuilders(
        plugins,
        builderFqnsInOrder,
        definitionContainer,
        enabledPluginFqns,
      );

      await saveDefinition((draft) => {
        // Plant the merged features + models first. Object.assign only
        // overwrites keys present on `seededDefinition` (apps/general/plugins
        // are all empty for a brand-new project) so subsequent mutations
        // below are not clobbered.
        if (defaults.seededDefinition) {
          Object.assign(draft, defaults.seededDefinition);
        }

        // 1. Set general settings
        draft.settings.general = {
          name: data.name,
          portOffset: data.portOffset,
          packageScope: '',
        };
        draft.apps = buildInitialApps(data.enabledApps, data.portOffset);
        draft.isInitialized = true;

        // Plugin entries for auth + rate-limit + storage + sentry + stripe +
        // dev-agents already landed on `draft.plugins` via `seededDefinition`
        // above (their configs are attached during the pre-save defaults
        // pass). Email and queue still need wizard-form input
        // (`implementationPluginKey`, library auto-create, Redis flag) so they
        // stay inline below.
        // 3. Configure email if enabled
        if (data.enableEmail) {
          const emailPlugin = findPlugin(plugins, EMAIL_PLUGIN_FQN);
          const implFqn = `@baseplate-dev/plugin-email:${data.emailProvider}`;
          const implPlugin = findPlugin(plugins, implFqn);

          if (emailPlugin && implPlugin) {
            PluginUtils.setPluginConfig(
              draft,
              emailPlugin,
              {
                implementationPluginKey: implPlugin.key,
                emailFeatureRef: FeatureUtils.ensureFeatureByNameRecursively(
                  draft,
                  EMAIL_FEATURE_NAME,
                ),
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
          }
        }

        // 4. Enable queue with chosen implementation if any feature needs it
        //    or the user explicitly toggled it on.
        if (needsQueue) {
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
      });
    },
    [plugins, definitionContainer, saveDefinition],
  );

  return { saveWithPlugins, saveBasicsOnly };
}
