import type {
  AppEntry,
  SchemaParserContext,
} from '@baseplate-dev/project-builder-lib';

import { ProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib';
import { sortBy } from 'es-toolkit';

import type { PackageCompiler } from './package-compiler.js';

import { PACKAGE_COMPILER_REGISTRY } from './compiler-registry.js';

/**
 * Compile all packages in a project definition
 *
 * Uses the compiler registry to support extensible package types.
 * Backend apps are compiled first as they are often dependencies for other apps.
 *
 * @param projectJson - Serialized project definition JSON
 * @param context - Schema parser context
 * @returns Array of compiled app entries with generator bundles
 */
export function compilePackages(
  projectJson: unknown,
  context: SchemaParserContext,
): AppEntry[] {
  const definitionContainer = ProjectDefinitionContainer.fromSerializedConfig(
    projectJson,
    context,
  );

  // Compile backend app first since it's likely the dependency for other apps
  const appConfigs = sortBy(definitionContainer.definition.apps, [
    (a) => (a.type === 'backend' ? 0 : 1),
    (a) => a.name,
  ]);

  const apps: AppEntry[] = appConfigs.map((app) =>
    (PACKAGE_COMPILER_REGISTRY[app.type] as PackageCompiler).compile(
      definitionContainer,
      app,
    ),
  );

  return apps;
}
