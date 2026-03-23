import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';
import type { ProjectDefinition } from '#src/schema/index.js';

import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

interface PluginRootCompilerOptions {
  projectDefinition: ProjectDefinition;
  definitionContainer: ProjectDefinitionContainer;
}

export interface PluginRootCompiler {
  pluginKey: string;
  compile: (
    options: PluginRootCompilerOptions,
  ) => Record<string, GeneratorBundle>;
}

/**
 * Spec for registering root package compilers
 *
 * Allows plugins to contribute generator bundles to the monorepo root package.
 * This is analogous to `appCompilerSpec` but for root-level files like
 * AGENTS.md, CLAUDE.md, .mcp.json, etc.
 */
export const rootCompilerSpec = createFieldMapSpec(
  'core/root-compiler',
  (t) => ({
    compilers: t.array<PluginRootCompiler>(),
  }),
);
