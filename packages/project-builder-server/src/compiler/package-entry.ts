import type { GeneratorBundle } from '@baseplate-dev/sync';

/**
 * Represents a compiled package entry (app or root package) ready for code generation
 *
 * A PackageEntry contains all information needed to generate code for a single
 * package in the monorepo, including its generator bundle and target directory.
 */
export interface PackageEntry {
  /** Unique identifier for the package */
  id: string;
  /** Package name */
  name: string;
  /** Relative directory path from project root (e.g., 'apps/backend', '.') */
  packageDirectory: string;
  /** Generator bundle containing all generation tasks for this package */
  generatorBundle: GeneratorBundle;
}
