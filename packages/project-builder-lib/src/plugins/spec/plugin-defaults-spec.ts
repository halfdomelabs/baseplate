import type { ProjectDefinition } from '#src/schema/index.js';

import type { ProjectDefinitionContainer } from '../../definition/project-definition-container.js';

import { createFieldMapSpec } from '../utils/create-field-map-spec.js';

/**
 * Context passed to a plugin's default-config builder.
 *
 * The builder receives the *mutable* draft so it can scaffold features,
 * libraries, or infrastructure entries it needs (via the same utilities the
 * setup wizard uses for auth — e.g. `FeatureUtils.ensureFeatureByNameRecursively`).
 * It then returns a valid config payload that the caller passes to
 * `PluginUtils.setPluginConfig`.
 */
export interface PluginDefaultsContext {
  draft: ProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
  /**
   * Fully-qualified names of every plugin the caller intends to enable in
   * this save. Lets a builder branch on what else is being turned on
   * (e.g. payments choosing a different feature path when billing is on).
   */
  enabledPluginFqns: ReadonlySet<string>;
}

export type PluginDefaultsBuilder = (ctx: PluginDefaultsContext) => unknown;

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
