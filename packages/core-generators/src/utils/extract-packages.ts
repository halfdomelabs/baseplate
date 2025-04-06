/**
 * Extract packages from a record
 * @param packages - The packages to extract
 * @param keys - The keys to extract
 * @returns The extracted packages
 */
export function extractPackageVersions<T extends Record<string, string>>(
  packages: T,
  keys: (keyof T)[],
): Record<keyof T, string> {
  return Object.fromEntries(
    Object.entries(packages).filter(([key]) => keys.includes(key)),
  ) as Record<keyof T, string>;
}
