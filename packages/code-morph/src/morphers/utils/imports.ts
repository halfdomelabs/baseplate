import {
  type ImportDeclarationStructure,
  Node,
  type OptionalKind,
  type SourceFile,
} from 'ts-morph';

/**
 * Add an import declaration to a source file to the first line after comments.
 *
 * @param sourceFile - The source file to add the import declaration to.
 * @param structure - The structure of the import declaration to add.
 */
export function insertImportDeclarationAtTop(
  sourceFile: SourceFile,
  importStructure: OptionalKind<ImportDeclarationStructure>,
): void {
  const statements = sourceFile.getStatementsWithComments();
  const firstNonCommentStatement =
    statements.find((statement) => !Node.isCommentStatement(statement)) ??
    undefined;
  sourceFile.insertImportDeclaration(
    firstNonCommentStatement?.getChildIndex() ?? 0,
    {
      ...importStructure,
      leadingTrivia: '\n',
    },
  );
}
