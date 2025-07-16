import type { TsImportDeclaration } from '../imports/types.js';
import type { TsImportMap } from './types.js';

/**
 * Transform import declarations with an import map.
 *
 * Import declarations whose module specifiers begin with `%` are transformed
 * using the import map. We first look up the correct import map using the
 * module specifier without the `%` prefix. If the import map is not found, an
 * error is thrown.
 *
 * Then we transform each named import using the import map entry found in the
 * import map.
 *
 * @param imports - The import declarations to transform.
 * @param importMaps - The import maps to use to transform the imports.
 * @returns The transformed import declarations.
 */
export function transformTsImportsWithMap(
  imports: TsImportDeclaration[],
  importMaps: Map<string, TsImportMap>,
  generatorPaths: Record<string, string>,
): TsImportDeclaration[] {
  return imports.flatMap((importDeclaration) => {
    if (importDeclaration.moduleSpecifier.startsWith('$')) {
      const generatorPath =
        generatorPaths[importDeclaration.moduleSpecifier.slice(1)];
      if (!generatorPath) {
        throw new Error(
          `Generator path not found for ${importDeclaration.moduleSpecifier}`,
        );
      }
      return [
        {
          ...importDeclaration,
          moduleSpecifier: generatorPath,
        },
      ];
    }

    if (!importDeclaration.moduleSpecifier.startsWith('%')) {
      return [importDeclaration];
    }

    const importMapKey = importDeclaration.moduleSpecifier.slice(1);

    const importMap = importMaps.get(importMapKey);

    if (!importMap) {
      throw new Error(
        `Import map not found for ${importDeclaration.moduleSpecifier}`,
      );
    }

    if (importDeclaration.namespaceImport || importDeclaration.defaultImport) {
      throw new Error(
        `Import map does not support namespace or default imports: ${importDeclaration.moduleSpecifier}`,
      );
    }

    const wildcardImport = (importMap as Partial<TsImportMap>)['*'];

    return (
      importDeclaration.namedImports?.map((namedImport) => {
        if (!(namedImport.name in importMap)) {
          if (wildcardImport) {
            return {
              moduleSpecifier: wildcardImport.moduleSpecifier,
              namedImports: [
                {
                  name: namedImport.name,
                  alias: namedImport.alias,
                  isTypeOnly: namedImport.isTypeOnly,
                },
              ],
              isTypeOnly: importDeclaration.isTypeOnly,
            };
          }
          throw new Error(`Import map entry not found for ${namedImport.name}`);
        }

        const entry = importMap[namedImport.name];

        return importDeclaration.isTypeOnly || namedImport.isTypeOnly
          ? entry.typeDeclaration()
          : entry.declaration();
      }) ?? []
    );
  });
}
