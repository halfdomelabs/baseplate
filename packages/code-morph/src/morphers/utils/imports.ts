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

/**
 * Add or update an import declaration in a source file.
 * If an import with the same module specifier exists, it will add the named imports to it.
 * If no matching import exists, it will create a new import declaration at the top.
 *
 * @param sourceFile - The source file to add/update the import declaration in
 * @param moduleSpecifier - The module specifier to import from
 * @param namedImports - Array of named imports to add
 */
export function addOrUpdateImport(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  namedImports: string[],
): void {
  // Find existing import with same module specifier
  const existingImport = sourceFile.getImportDeclaration(
    (imp) => imp.getModuleSpecifierValue() === moduleSpecifier,
  );

  if (existingImport) {
    // Add new named imports to existing import
    const existingNamedImports = existingImport.getNamedImports();
    const existingNames = new Set(
      existingNamedImports.map((imp) => imp.getName()),
    );

    // Only add imports that don't already exist
    const newImports = namedImports.filter((name) => !existingNames.has(name));

    if (newImports.length > 0) {
      existingImport.addNamedImports(newImports);
    }
  } else {
    // Create new import declaration at the top
    insertImportDeclarationAtTop(sourceFile, {
      moduleSpecifier,
      namedImports: namedImports.map((name) => ({ name })),
    });
  }
}
