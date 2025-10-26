import type { SchemaParserContext } from '@baseplate-dev/project-builder-lib';

import { ProjectDefinitionContainer } from '@baseplate-dev/project-builder-lib';
import { sortBy } from 'es-toolkit';

import type { PackageCompiler } from './package-compiler.js';
import type { PackageEntry } from './package-entry.js';

import { PACKAGE_COMPILER_REGISTRY } from './compiler-registry.js';
import { rootPackageCompiler } from './root/index.js';

/**
 * Compile all packages in a project definition
 *
 * Uses the compiler registry to support extensible package types.
 * Root package is compiled first, then backend apps, then other apps.
 *
 * @param projectJson - Serialized project definition JSON
 * @param context - Schema parser context
 * @returns Array of compiled package entries with generator bundles (root first, then apps)
 */
export function compilePackages(
  projectJson: unknown,
  context: SchemaParserContext,
): PackageEntry[] {
  const definitionContainer = ProjectDefinitionContainer.fromSerializedConfig(
    projectJson,
    context,
  );

  // 1. Compile root package first
  const rootEntry = rootPackageCompiler.compile(definitionContainer);

  // 2. Compile backend app first since it's likely the dependency for other apps
  const appConfigs = sortBy(definitionContainer.definition.apps, [
    (a) => (a.type === 'backend' ? 0 : 1),
    (a) => a.name,
  ]);

  const apps: PackageEntry[] = appConfigs.map((app) =>
    (PACKAGE_COMPILER_REGISTRY[app.type] as PackageCompiler).compile(
      definitionContainer,
      app,
    ),
  );

  // 3. Return root entry first, then app entries
  return [rootEntry, ...apps];
}
