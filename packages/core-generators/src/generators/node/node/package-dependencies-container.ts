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

interface NodePackagePeerInfo {
  name: string;
  version: string;
  source: string | undefined;
}

export interface NodePackageDependencies {
  dev: Record<string, string>;
  prod: Record<string, string>;
  peer: Record<string, string>;
}

/**
 * Container for managing Node.js dependencies with specific merging rules
 */
export class NodePackageDependenciesContainer implements FieldContainer<NodePackageDependencies> {
  private readonly _value: Map<string, NodePackageDependencyInfo>;
  /**
   * Peer dependencies are tracked in a separate map from dev/prod since a
   * package (e.g. `react`) is commonly both a peer dependency (for consumers)
   * and a dev dependency (needed locally to build/test) at once - something
   * the single dev/prod map can't represent since it allows only one type per
   * package name.
   */
  private readonly _peerValue: Map<string, NodePackagePeerInfo>;
  protected getDynamicSource: FieldContainerDynamicSourceGetter | undefined;

  constructor(options?: FieldContainerOptions) {
    this._value = new Map<string, NodePackageDependencyInfo>();
    this._peerValue = new Map<string, NodePackagePeerInfo>();
    this.getDynamicSource = options?.getDynamicSource;
  }

  /**
   * Resolves the version to use when merging a new version in for an existing
   * entry, keeping whichever of the two semver ranges is narrower/more specific.
   * @param name - The name of the dependency (used in the error message)
   * @param oldVersion - The existing version
   * @param newVersion - The version being merged in
   */
  private resolveMergedVersion(
    name: string,
    oldVersion: string,
    newVersion: string,
  ): string {
    if (
      newVersion === oldVersion ||
      semver.subset(oldVersion, newVersion) // Proposed version is broader or equal
    ) {
      return oldVersion; // Keep the existing, more specific or equal version
    }
    if (semver.subset(newVersion, oldVersion)) {
      // Proposed version is narrower
      return newVersion; // Use the new, more specific version
    }
    // Versions are incompatible ranges or values
    throw new Error(
      `Could not merge incompatible versions for dependency "${name}": existing "${oldVersion}"`,
    );
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
      const newVersion = this.resolveMergedVersion(
        name,
        existingEntry.version,
        version,
      );

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
   * Add peer dependencies to the container. Peer entries are tracked
   * independently of dev/prod, so a package can be both a peer dependency
   * and a dev/prod dependency at the same time.
   * @param packages - The dependencies to add
   */
  addPeerPackages(packages: Record<string, string>): void {
    for (const [name, version] of Object.entries(packages)) {
      const existingEntry = this._peerValue.get(name);
      const newVersion = existingEntry
        ? this.resolveMergedVersion(name, existingEntry.version, version)
        : version;

      this._peerValue.set(name, {
        name,
        version: newVersion,
        source: this.getDynamicSource?.(),
      });
    }
  }

  /**
   * Add multiple dependencies to the container
   * @param packages - The dependencies to add
   * @param type - The type of the dependencies (dev, prod, or peer)
   */
  addPackages(packages: Partial<NodePackageDependencies>): void {
    for (const [name, version] of Object.entries(packages.prod ?? {})) {
      this.add(name, version, 'prod');
    }
    for (const [name, version] of Object.entries(packages.dev ?? {})) {
      this.add(name, version, 'dev');
    }
    this.addPeerPackages(packages.peer ?? {});
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
      peer: Object.fromEntries(
        [...this._peerValue.entries()].map(([name, info]) => [
          name,
          info.version,
        ]),
      ),
    };
  }
}

// Helper function to create the container easily in the schema builder
export function createNodePackageDependenciesContainer(
  options?: FieldContainerOptions,
): NodePackageDependenciesContainer {
  return new NodePackageDependenciesContainer(options);
}
