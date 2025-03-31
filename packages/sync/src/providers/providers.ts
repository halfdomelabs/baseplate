import { toMerged } from 'es-toolkit';

import { KEBAB_CASE_REGEX } from '@src/utils/validation.js';

import type { ProviderExportScope } from './export-scopes.js';

/**
 * A provider is a dictionary of functions that allow generator tasks
 * to communicate with other tasks
 */
export type Provider = Record<string, (...args: unknown[]) => unknown>;

/**
 * A provider type is a typed tag for a provider so that it can
 * be referenced programatically while retaining the type
 */
export interface ProviderType<P = Provider> {
  /**
   * The type of the tag (e.g. 'type', 'dependency', 'export')
   */
  readonly type: 'type';
  /**
   * The name of the provider type
   */
  readonly name: string;
  /**
   * Whether the provider is read-only or not such that it cannot modify any state in the generator task
   *
   * This allows the sync engine to optimize the dependency graph by not including dependencies
   * between the build step of dependent task and the build step of the export task.
   */
  readonly isReadOnly?: boolean;
  /**
   * Whether the provider is used as an output provider (i.e. read-only)
   */
  readonly isOutput?: boolean;
  /**
   * Creates a dependency config for the provider that can be used in dependency maps
   */
  dependency(): ProviderDependency<P>;
  /**
   * Creates an export config for the provider that can be used in export maps
   */
  export(scope?: ProviderExportScope, exportName?: string): ProviderExport<P>;
}

export interface ProviderDependencyOptions {
  /**
   * Whether the dependency is optional or not
   */
  optional?: boolean;
  /**
   * The export name of the provider to resolve to (if empty string, forces the dependency to resolve to undefined)
   */
  exportName?: string;
  /**
   * Whether the provider is read-only or not (i.e. cannot modify any state in the generator task)
   */
  readonly isReadOnly?: boolean;
  /**
   * Whether the provider is an output provider (i.e. read-only). Only output providers
   * can be used in the outputs of a task.
   */
  readonly isOutput?: boolean;
}

/**
 * A provider type that can be configured for use in a dependency map
 */
export interface ProviderDependency<P = Provider> {
  readonly type: 'dependency';
  readonly name: string;
  readonly options: ProviderDependencyOptions;
  /**
   * Creates an optional dependency
   */
  optional(): ProviderDependency<P | undefined>;
  /**
   * Specifies that the dependency should be resolved to an export from
   * a specific generator
   *
   * @param exportName The export name of the provider to resolve to
   */
  reference(exportName: string): ProviderDependency<P>;
  /**
   * Specifies that the dependency should be resolved to an export from
   * a specific generator, but otherwise resolve to undefined if no
   * reference is provided
   *
   * @param exportName The export name of the provider to resolve to
   * if the reference is provided
   */
  optionalReference(
    exportName: string | undefined,
  ): ProviderDependency<P | undefined>;
}

/**
 * A provider type that can be configured for use in an export map
 */
export interface ProviderExport<P = Provider> {
  readonly type: 'export';
  readonly name: string;
  readonly isOutput: boolean;
  /**
   * The scope/name pairs that the provider will be available in
   */
  readonly exports: {
    /**
     * The scope the export is available in (if undefined, it is available to the default scope of its children only)
     */
    readonly scope: ProviderExportScope | undefined;
    /**
     * The name of the export (if undefined, it is the default export)
     */
    readonly exportName: string | undefined;
  }[];
  /**
   * Adds an export to the provider
   */
  andExport(scope: ProviderExportScope, exportName?: string): ProviderExport<P>;
}

/**
 * Options for a provider type
 */
interface ProviderTypeOptions {
  /**
   * Whether the provider is an output provider (i.e. read-only). Only output providers
   * can be used in the outputs of a task.
   */
  isOutput?: boolean;
  /**
   * Whether the functions in the provider are read-only such that they cannot
   * modify any state in the generator task
   *
   * This allows the sync engine to optimize the dependency graph by not including dependencies
   * between the build step of dependent task and the build step of the export task.
   */
  isReadOnly?: boolean;
}

/**
 * Creates a provider type
 *
 * @param name The name of the provider type
 * @param options The options for the provider type
 * @returns The provider type
 */
export function createProviderType<T>(
  name: string,
  options?: ProviderTypeOptions,
): ProviderType<T> {
  if (!KEBAB_CASE_REGEX.test(name)) {
    throw new Error(
      `Provider type name must be in kebab case (lowercase with dashes): ${name}`,
    );
  }

  return {
    type: 'type',
    name,
    isReadOnly: options?.isReadOnly,
    dependency() {
      return {
        ...this,
        type: 'dependency',
        options: options?.isReadOnly ? { isReadOnly: true } : {},
        optional() {
          return toMerged(this, { options: { optional: true } });
        },
        reference(exportName) {
          if (this.options.exportName !== undefined) {
            throw new Error('Cannot overwrite export name on provider type');
          }
          return toMerged(this, {
            options: { exportName },
          });
        },
        optionalReference(exportName) {
          if (this.options.exportName !== undefined) {
            throw new Error('Cannot overwrite export name on provider type');
          }
          return toMerged(this, {
            // empty string is equivalent to resolving to undefined
            options: { exportName: exportName ?? '', optional: true },
          });
        },
      };
    },
    export(scope, exportName) {
      return {
        ...this,
        type: 'export',
        isOutput: options?.isOutput ?? false,
        exports: [{ scope, exportName }],
        andExport(scope, exportName) {
          return toMerged(this, {
            exports: [...this.exports, { scope, exportName }],
          });
        },
      };
    },
  };
}

/**
 * Creates an output provider type
 *
 * @param name The name of the provider type
 * @param options The options for the provider type
 * @returns The provider type
 */
export function createOutputProviderType<T>(
  name: string,
  options?: Omit<ProviderTypeOptions, 'isOutput'>,
): ProviderType<T> {
  return createProviderType(name, { ...options, isOutput: true });
}
