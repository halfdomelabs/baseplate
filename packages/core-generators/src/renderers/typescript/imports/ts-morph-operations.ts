import type { CodeBlockWriter, ImportDeclaration, SourceFile } from 'ts-morph';

import type { TsImportDeclaration } from './types.js';

function isSideEffectImport(declaration: ImportDeclaration): boolean {
  return (
    !declaration.isTypeOnly() &&
    declaration.getNamespaceImport() === undefined &&
    declaration.getDefaultImport() === undefined &&
    declaration.getNamedImports().length === 0
  );
}

/**
 * Get all side effect imports from a source file
 * @param file - The source file to get side effect imports from
 * @returns All side effect imports from the source file
 */
export function getSideEffectImportsFromSourceFile(
  file: SourceFile,
): ImportDeclaration[] {
  return file.getImportDeclarations().filter(isSideEffectImport);
}

/**
 * Get all ts-morph import declarations from a source file that are not side effect imports
 * @param file - The source file to get import declarations from
 * @returns All ts-morph import declarations from the source file that are not side effect imports
 */
export function getTsMorphImportDeclarationsFromSourceFile(
  file: SourceFile,
): ImportDeclaration[] {
  return file
    .getImportDeclarations()
    .filter((declaration) => !isSideEffectImport(declaration));
}

/**
 * Convert ts-morph import declarations to TsImportDeclaration
 * @param declaration - The import declaration to convert
 * @returns The converted import declaration
 */
export function convertTsMorphImportDeclarationToTsImportDeclaration(
  declaration: ImportDeclaration,
): TsImportDeclaration {
  return {
    source: declaration.getModuleSpecifier().getLiteralValue(),
    isTypeOnly: declaration.isTypeOnly(),
    namespaceImport: declaration.getNamespaceImport()?.getText(),
    defaultImport: declaration.getDefaultImport()?.getText(),
    namedImports: declaration.getNamedImports().map((namedImport) => ({
      name: namedImport.getName(),
      alias: namedImport.getAliasNode()?.getText(),
      isTypeOnly: namedImport.isTypeOnly(),
    })),
  };
}

function writeImportDeclaration(
  writer: CodeBlockWriter,
  importDeclaration: TsImportDeclaration,
): void {
  const {
    namespaceImport,
    defaultImport,
    namedImports = [],
    source,
    isTypeOnly,
  } = importDeclaration;
  const hasNamedImports = namedImports.length > 0;
  if (!!namespaceImport && (!!defaultImport || hasNamedImports)) {
    throw new Error(
      'Cannot have an import with both namespace and named/default imports!',
    );
  }
  writer.write('import');
  if (!!namespaceImport || !!defaultImport || hasNamedImports) {
    writer.conditionalWrite(isTypeOnly, ' type');
    if (namespaceImport) {
      writer.write(` * as ${namespaceImport}`);
    }
    if (defaultImport) {
      writer.write(` ${defaultImport}`);
    }
    if (hasNamedImports) {
      writer.conditionalWrite(!!defaultImport, ',');
      // sort named imports
      writer.write(' ');
      writer.write('{');
      for (const [i, namedImport] of namedImports.entries()) {
        writer.conditionalWrite(i !== 0, ',');
        writer.conditionalWrite(namedImport.isTypeOnly, ' type');
        writer.write(` ${namedImport.name}`);
        if (namedImport.alias) {
          writer.write(` as ${namedImport.alias}`);
        }
      }
      writer.write(' }');
    }
    writer.write(' from');
  }
  writer.write(' ');
  writer.quote(source);
  writer.write(';\n');
}

/**
 * Write import declarations with a CodeBlockWriter
 * @param writer - The CodeBlockWriter to write to
 * @param imports - The import declarations to write grouped by sections
 */
export function writeGroupedImportDeclarationsWithCodeBlockWriter(
  writer: CodeBlockWriter,
  imports: TsImportDeclaration[][],
): void {
  for (const importSection of imports) {
    for (const importDeclaration of importSection) {
      writeImportDeclaration(writer, importDeclaration);
    }
    writer.write('\n');
  }
}
