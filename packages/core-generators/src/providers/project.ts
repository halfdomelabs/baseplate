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
  /**
   * Gets the path to the src/ folder of the package.
   */
  getPackageSrcPath(): string;
}

export const packageInfoProvider =
  createReadOnlyProviderType<PackageProvider>('package');
