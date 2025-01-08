import { toMerged } from 'es-toolkit';

import {
  KEBAB_CASE_REGEX,
  KEBAB_CASE_WITH_SLASH_SEPARATOR_REGEX,
} from '@src/utils/validation.js';

/**
 * A provider is a dictionary of functions that allow a generator
 * to interact with a generator
 */
export type Provider = Record<string, (...args: unknown[]) => unknown>;

export interface ProviderExportScope {
  readonly name: string;
  readonly description: string;
}

export function createProviderExportScope(
  name: string,
  description: string,
): ProviderExportScope {
  if (!KEBAB_CASE_WITH_SLASH_SEPARATOR_REGEX.test(name)) {
    throw new Error(
      `Provider export scope name must be in kebab case (lowercase with dashes) with slashes to namespace the scope: ${name}`,
    );
  }
  return { name, description };
}

/**
 * A provider type is a typed tag for a provider so that it can
 * be referrenced programatically while retaining the type
 */
export interface ProviderType<P = Provider> {
  readonly type: 'type';
  readonly name: string;
  /**
   * Whether the provider is read-only or not (i.e. cannot modify any state in the generator task)
   */
  readonly isReadOnly?: boolean;
  /**
   * Creates a dependency config for the provider that can be used in dependency maps
   */
  dependency(): ProviderDependency<P>;
  /**
   * Creates an export config for the provider that can be used in export maps
   */
  export(scope: ProviderExportScope, exportName?: string): ProviderExport<P>;
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
}

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

export interface ProviderExport<P = Provider> {
  readonly type: 'export';
  readonly name: string;
  /**
   * Which scopes the export is available in
   */
  readonly exports: {
    readonly scope: ProviderExportScope;
    readonly exportName?: string;
  }[];
  /**
   * Adds an export to the provider
   */
  andExport(scope: ProviderExportScope, exportName?: string): ProviderExport<P>;
}

interface ProviderTypeOptions {
  isReadOnly?: boolean;
}

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
        exports: [
          {
            scope,
            exportName,
          },
        ],
        andExport(scope, exportName) {
          return toMerged(this, {
            exports: [...this.exports, { scope, exportName }],
          });
        },
      };
    },
  };
}
