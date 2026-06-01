import type {
  PartialProjectDefinitionInput,
  ProjectDefinition,
} from '#src/schema/index.js';

import type { PluginMetadataWithPaths } from '../metadata/types.js';
import type { PluginSpecStore } from '../store/store.js';

import { createFieldMapSpec } from '../utils/create-field-map-spec.js';

/**
 * Context passed to a plugin's default-config builder.
 *
 * The builder receives the *mutable* draft so it can scaffold features,
 * libraries, or infrastructure entries it needs (via the same utilities the
 * setup wizard uses for auth — e.g. `FeatureUtils.ensureFeatureByNameRecursively`).
 * It then returns a valid config payload that the caller passes to
 * `PluginUtils.setPluginConfig`, plus an optional `partialDef` describing the
 * models / features the plugin's runtime needs so the caller can seed them
 * (using the same merge machinery the model-sync issue checker uses).
 */
export interface PluginDefaultsContext {
  /**
   * Mutable view of the draft project definition. Already includes any prior
   * plugins' features + models merged in via previous builders. Builders may
   * write to it via utilities like `FeatureUtils.ensureFeatureByNameRecursively`
   * so they can embed a feature ID in their returned config.
   */
  draft: ProjectDefinition;
  /**
   * Spec store with every about-to-be-enabled plugin's modules initialized.
   * Use this for any cross-plugin spec lookups (e.g. `authModelsSpec`).
   *
   * NOTE: this is intentionally provided instead of a `container` field. A
   * regular `ProjectDefinitionContainer.pluginStore` only contains plugins
   * already present in `definition.plugins`, which is empty for a brand-new
   * project mid-wizard — using it would silently miss cross-plugin spec
   * registrations like `authModelsSpec`.
   */
  pluginStore: PluginSpecStore;
  /**
   * Fully-qualified names of every plugin the caller intends to enable in
   * this save. Lets a builder branch on what else is being turned on
   * (e.g. the parent auth plugin picking its implementation, or payments
   * choosing a different feature path when billing is on).
   */
  enabledPluginFqns: ReadonlySet<string>;
  /**
   * Resolves a plugin's metadata (incl. its generated `key`) from its FQN.
   * Useful for builders that need to embed another plugin's key in their
   * config — e.g. the parent auth plugin's `implementationPluginKey`.
   */
  findPluginMetadataByFqn: (fqn: string) => PluginMetadataWithPaths | undefined;
}

export interface PluginDefaultsResult {
  /** The plugin config payload to hand to `PluginUtils.setPluginConfig`. */
  config: unknown;
  /**
   * Optional serialized partial definition (uses entity names, not IDs) that
   * the caller should merge into the project definition. Use this to scaffold
   * the Prisma models, relations, etc. the plugin needs. The shape matches
   * what the plugin's model-sync issue checker produces, so the same
   * `createXxxPartialDefinition` helper can be reused.
   */
  partialDef?: PartialProjectDefinitionInput;
}

export type PluginDefaultsBuilder = (
  ctx: PluginDefaultsContext,
) => PluginDefaultsResult;

/**
 * Spec for a plugin to declare how to enable itself with sensible defaults.
 *
 * Keyed by plugin key. The setup wizard (and any future "Enable with defaults"
 * button on the per-plugin editor) calls the registered builder to produce a
 * valid initial config — instead of trying to enable the plugin with `{}` and
 * crashing on Zod validation for required entity refs.
 */
export const pluginDefaultsSpec = createFieldMapSpec(
  'core/plugin-defaults',
  (t) => ({
    builders: t.map<string, PluginDefaultsBuilder>(),
  }),
);
