import { createReadOnlyProviderType } from '@baseplate-dev/sync';

export interface PackageProvider {
  /**
   * Get the name of the project.
   */
  getPackageName(): string;
  /**
   * Get the canonical path to the root of the package.
   */
  getPackageRoot(): string;
}

export const packageProvider =
  createReadOnlyProviderType<PackageProvider>('package');
