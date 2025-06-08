interface ParsedPackagePathSpecifier {
  packageName: string;
  filePath: string;
}

function parsePackagePathSpecifier(spec: string): ParsedPackagePathSpecifier {
  const [packageName, filePath] = spec.split(':', 2);
  return { packageName, filePath };
}

/**
 * Resolve the correct import for a package path specifier from a specific package.
 *
 * @param packagePathSpecifier - The package path specifier is a path that inclues
 * the package name and the path to the file, e.g. `@baseplate-dev/core-generators:src/renderers/plugins/typed-templates-file.ts`
 * @param importingPackage - The name of the package importing the packagePathSpecifier.
 * @returns The resolved import path which is either a package name or the subpath import (e.g. `#src/...`).
 */
export function resolvePackagePathSpecifier(
  packagePathSpecifier: string,
  importingPackage: string,
): string {
  const parsed = parsePackagePathSpecifier(packagePathSpecifier);
  if (parsed.packageName === importingPackage) {
    return `#${parsed.filePath}`;
  }
  // Return the package name directly if importing from another package.
  return parsed.packageName;
}
