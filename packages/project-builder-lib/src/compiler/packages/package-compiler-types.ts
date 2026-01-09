import type { GeneratorBundle } from '@baseplate-dev/sync';

import type { ProjectDefinitionContainer } from '#src/definition/project-definition-container.js';

/**
 * Represents a compiled package entry ready for code generation
 *
 * A PackageEntry contains all information needed to generate code for a single
 * package in the monorepo, including its generator bundle and target directory.
 */
export interface PackageEntry {
  /** Unique identifier for the package */
  id: string;
  /** Package name */
  name: string;
  /** Relative directory path from project root (e.g., 'packages/utils', '.') */
  packageDirectory: string;
  /** Generator bundle containing all generation tasks for this package */
  generatorBundle: GeneratorBundle;
}

/**
 * Tasks for a package used in turbo configuration
 */
export interface PackageTasks {
  build: string[];
  dev: string[];
  watch: string[];
}

export interface PackageCompilerTasks {
  build: string[];
  dev: string[];
  watch: string[];
}

export interface PackageCompilerContext {
  compilers: PackageCompiler[];
}

/**
 * Abstract base class for package type compilers
 *
 * Each package type (backend, web, library, etc.) extends this class
 * to define how it should be compiled into a PackageEntry with generator bundles.
 *
 * Each child class defines its own constructor requirements based on what
 * information it needs (e.g., app config, definition container).
 */
export abstract class PackageCompiler {
  protected readonly definitionContainer: ProjectDefinitionContainer;

  constructor(definitionContainer: ProjectDefinitionContainer) {
    this.definitionContainer = definitionContainer;
  }
  /**
   * Compile a package configuration into a PackageEntry with generator bundle
   *
   * @returns PackageEntry with generated bundle ready for sync
   */
  abstract compile(context: PackageCompilerContext): PackageEntry;

  /**
   * Get the formatted package name (e.g., '@scope/backend' or 'project-backend')
   *
   * @returns Formatted package name
   */
  abstract getPackageName(): string;

  /**
   * Get the package directory path relative to monorepo root
   *
   * @returns Package directory path (e.g., 'apps/backend', '.')
   */
  abstract getPackageDirectory(): string;

  /**
   * Get the tasks for a package used in turbo configuration
   *
   * @returns Object with build, dev, and watch tasks
   */
  getTasks(): PackageTasks {
    return {
      build: [],
      dev: [],
      watch: [],
    };
  }
}
