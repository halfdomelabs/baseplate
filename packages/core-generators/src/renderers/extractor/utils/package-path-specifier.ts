interface ParsedPackagePathSpecifier {
  packageName: string;
  filePath: string;
}

/**
 * Parse a package path specifier into a package name and file path.
 *
 * @param spec - The package path specifier in the format "package-name:file-path"
 * @returns The parsed package name and file path
 */
function parsePackagePathSpecifier(spec: string): ParsedPackagePathSpecifier {
  if (!spec || typeof spec !== 'string') {
    throw new Error('Package path specifier must be a non-empty string');
  }

  if (!spec.includes(':')) {
    throw new Error(
      `Invalid package path specifier: "${spec}". Expected format: "package-name:file-path"`,
    );
  }

  const [packageName, filePath] = spec.split(':', 2);

  if (!packageName || !filePath) {
    throw new Error(
      `Invalid package path specifier: "${spec}". Both package name and file path are required`,
    );
  }

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
    return `#${parsed.filePath.replace(/\.(t|j)sx?$/, '.js')}`;
  }
  // Return the package name directly if importing from another package.
  return parsed.packageName;
}
