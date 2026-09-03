import type { SourceFile } from 'ts-morph';

import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { Project } from 'ts-morph';

export interface TsFileExportInfo {
  isDefault?: boolean;
  isTypeOnly?: boolean;
}

export interface TsFileExports {
  /**
   * The exports of the file keyed by the name importers use, e.g. `bar` for
   * `export { foo as bar }` and `default` for default exports.
   */
  exports: Map<string, TsFileExportInfo>;
  /**
   * Whether the file has any `export * from` declaration, meaning an export may
   * be re-exported from another module and not visible in this file alone.
   */
  hasStarExports: boolean;
}

function collectExportsFromSourceFile(sourceFile: SourceFile): TsFileExports {
  const exports = new Map<string, TsFileExportInfo>();
  let hasStarExports = false;

  function addExport(name: string, isTypeOnly: boolean): void {
    exports.set(name, { isTypeOnly });
  }

  // Names introduced by export declarations, e.g. `export { foo as bar }` or
  // `export * as ns from './foo.js'`. `export * from` cannot be resolved from this
  // file alone so it is only flagged.
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const namespaceExport = exportDecl.getNamespaceExport();
    if (namespaceExport) {
      addExport(namespaceExport.getName(), exportDecl.isTypeOnly());
      continue;
    }
    if (exportDecl.isNamespaceExport()) {
      hasStarExports = true;
      continue;
    }
    for (const namedExport of exportDecl.getNamedExports()) {
      // getName returns the local name so the alias is the name importers see
      addExport(
        namedExport.getAliasNode()?.getText() ?? namedExport.getName(),
        exportDecl.isTypeOnly() || namedExport.isTypeOnly(),
      );
    }
  }

  // Declarations carrying an `export` modifier. Declarations exported through an
  // `export { ... }` statement are already covered above under their exported name.
  for (const statement of sourceFile.getVariableStatements()) {
    if (!statement.hasExportKeyword()) continue;
    for (const declaration of statement.getDeclarations()) {
      addExport(declaration.getName(), false);
    }
  }

  const valueDeclarations = [
    ...sourceFile.getFunctions(),
    ...sourceFile.getClasses(),
    ...sourceFile.getEnums(),
    ...sourceFile.getModules(),
  ];
  for (const declaration of valueDeclarations) {
    const name = declaration.getName();
    // default exports are picked up by the default export symbol below
    if (
      !name ||
      !declaration.hasExportKeyword() ||
      declaration.isDefaultExport()
    )
      continue;
    addExport(name, false);
  }

  for (const declaration of [
    ...sourceFile.getInterfaces(),
    ...sourceFile.getTypeAliases(),
  ]) {
    if (!declaration.hasExportKeyword() || declaration.isDefaultExport())
      continue;
    addExport(declaration.getName(), true);
  }

  const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
  if (defaultExportSymbol) {
    exports.set(defaultExportSymbol.getName(), {
      isDefault: true,
      isTypeOnly: false,
    });
  }

  return { exports, hasStarExports };
}

/**
 * Extracts all available exports from the contents of a TypeScript file.
 */
export function inferExportsFromTsSource(
  filePath: string,
  contents: string,
): TsFileExports {
  try {
    const project = new Project({ useInMemoryFileSystem: true });
    return collectExportsFromSourceFile(
      project.createSourceFile(filePath, contents),
    );
  } catch (error) {
    throw enhanceErrorWithContext(
      error,
      `Failed to extract exports from ${filePath}`,
    );
  }
}

/**
 * Extracts all available exports from a TypeScript file on disk.
 */
export function inferExportsFromTsFile(filePath: string): TsFileExports {
  try {
    const project = new Project();
    return collectExportsFromSourceFile(project.addSourceFileAtPath(filePath));
  } catch (error) {
    throw enhanceErrorWithContext(
      error,
      `Failed to extract exports from ${filePath}`,
    );
  }
}
