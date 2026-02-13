import type {
  FieldContainer,
  FieldContainerDynamicSourceGetter,
  FieldContainerOptions,
} from '@baseplate-dev/utils';

import semver from 'semver';

type NodePackageDependencyType = 'dev' | 'prod';

interface NodePackageDependencyInfo {
  name: string;
  version: string;
  type: NodePackageDependencyType;
  source: string | undefined;
}

export interface NodePackageDependencies {
  dev: Record<string, string>;
  prod: Record<string, string>;
}

/**
 * Container for managing Node.js dependencies with specific merging rules
 */
export class NodePackageDependenciesContainer implements FieldContainer<NodePackageDependencies> {
  private readonly _value: Map<string, NodePackageDependencyInfo>;
  protected getDynamicSource: FieldContainerDynamicSourceGetter | undefined;

  constructor(options?: FieldContainerOptions) {
    this._value = new Map<string, NodePackageDependencyInfo>();
    this.getDynamicSource = options?.getDynamicSource;
  }

  /**
   * Add a dependency to the container
   * @param name - The name of the dependency
   * @param version - The version of the dependency
   * @param type - The type of the dependency (dev or prod)
   */
  add(name: string, version: string, type: NodePackageDependencyType): void {
    const existingEntry = this._value.get(name);

    if (existingEntry) {
      const oldVersion = existingEntry.version;
      let newVersion: string | undefined;

      // Check for semantic version compatibility
      if (
        version === oldVersion ||
        semver.subset(oldVersion, version) // Proposed version is broader or equal
      ) {
        newVersion = oldVersion; // Keep the existing, more specific or equal version
      } else if (semver.subset(version, oldVersion)) {
        // Proposed version is narrower
        newVersion = version; // Use the new, more specific version
      } else {
        // Versions are incompatible ranges or values
        throw new Error(
          `Could not merge incompatible versions for dependency "${name}": existing "${oldVersion}"`,
        );
      }

      // Determine the final type: 'normal' takes precedence over 'dev'
      const finalType =
        existingEntry.type === 'prod' || type === 'prod' ? 'prod' : 'dev';

      this._value.set(name, {
        name,
        version: newVersion,
        type: finalType,
        source: this.getDynamicSource?.(),
      });
    } else {
      // Dependency doesn't exist, add it
      this._value.set(name, {
        name,
        version,
        type,
        source: this.getDynamicSource?.(),
      });
    }
  }

  /**
   * Add production dependencies to the container
   * @param packages - The dependencies to add
   */
  addProdPackages(packages: Record<string, string>): void {
    for (const [name, version] of Object.entries(packages)) {
      this.add(name, version, 'prod');
    }
  }

  /**
   * Add development dependencies to the container
   * @param packages - The dependencies to add
   */
  addDevPackages(packages: Record<string, string>): void {
    for (const [name, version] of Object.entries(packages)) {
      this.add(name, version, 'dev');
    }
  }

  /**
   * Add multiple dependencies to the container
   * @param packages - The dependencies to add
   * @param type - The type of the dependencies (dev or prod)
   */
  addPackages(packages: Partial<NodePackageDependencies>): void {
    for (const [name, version] of Object.entries(packages.prod ?? {})) {
      this.add(name, version, 'prod');
    }
    for (const [name, version] of Object.entries(packages.dev ?? {})) {
      this.add(name, version, 'dev');
    }
  }

  getValue(): NodePackageDependencies {
    const value = this._value;
    function getPackageType(
      type: NodePackageDependencyType,
    ): Record<string, string> {
      return Object.fromEntries(
        [...value.entries()]
          .filter(([, info]) => info.type === type)
          .map(([name, info]) => [name, info.version]),
      );
    }
    return {
      dev: getPackageType('dev'),
      prod: getPackageType('prod'),
    };
  }
}

// Helper function to create the container easily in the schema builder
export function createNodePackageDependenciesContainer(
  options?: FieldContainerOptions,
): NodePackageDependenciesContainer {
  return new NodePackageDependenciesContainer(options);
}
