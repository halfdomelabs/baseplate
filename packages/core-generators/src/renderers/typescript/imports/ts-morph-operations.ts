import {
  type CodeBlockWriter,
  type ImportDeclaration,
  Node,
  type SourceFile,
} from 'ts-morph';

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
    moduleSpecifier: declaration.getModuleSpecifier().getLiteralValue(),
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
    moduleSpecifier: source,
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

/**
 * Replace import declarations in a source file preserving the leading trivia and any
 * directives that may be present.
 *
 * Note: It currently does not handle comments above the first import statement and will
 * push it below the imports.
 *
 * @param sourceFile - The source file to replace import declarations in
 * @param oldImportDeclarations - The old import declarations to replace
 * @param newImportDeclarations - The new import declarations to replace with
 */
export function replaceImportDeclarationsInSourceFile(
  sourceFile: SourceFile,
  oldImportDeclarations: ImportDeclaration[],
  newImportDeclarations: TsImportDeclaration[][],
  {
    beforeImportsWriter,
    afterImportsWriter,
  }: {
    beforeImportsWriter?: (writer: CodeBlockWriter) => void;
    afterImportsWriter?: (writer: CodeBlockWriter) => void;
  } = {},
): void {
  const firstLine = sourceFile.getFullText().split('\n').at(0);

  // Get first non-directive node and insert after that node
  const firstNonDirectiveNode =
    oldImportDeclarations.at(0)?.getFullStart() === 0
      ? undefined
      : sourceFile.getStatements().find((node) => {
          // look for things like "use client"
          if (!Node.isExpressionStatement(node)) return true;
          const children = node.forEachChildAsArray();
          if (children.length !== 1) return true;
          const child = children[0];
          return !Node.isStringLiteral(child);
        });
  const insertionPosition = firstNonDirectiveNode?.getNonWhitespaceStart() ?? 0;

  // special case shebang to remove the first line if it's a shebang
  const firstNonDirectiveNodeHasShebang = firstNonDirectiveNode
    ?.getFullText()
    .startsWith('#!');

  for (const importDeclaration of oldImportDeclarations) {
    importDeclaration.remove();
  }

  sourceFile.insertText(insertionPosition, (writer) => {
    if (beforeImportsWriter) {
      beforeImportsWriter(writer);
    }
    writeGroupedImportDeclarationsWithCodeBlockWriter(
      writer,
      newImportDeclarations,
    );
    if (afterImportsWriter) {
      afterImportsWriter(writer);
    }
  });

  // and special case handling if the first non directive node has a shebang
  if (firstNonDirectiveNodeHasShebang) {
    sourceFile.replaceWithText(
      sourceFile.getFullText().replaceAll(`${firstLine}\n`, ''),
    );
  }
  // re-insert the first line if it's a shebang since ts-morph will remove it with the import
  if (firstLine?.startsWith('#!')) {
    sourceFile.insertText(0, `${firstLine}\n\n`);
  }
}
