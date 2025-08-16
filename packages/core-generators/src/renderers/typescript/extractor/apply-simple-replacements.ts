import { escapeRegExp } from 'es-toolkit';
import { Node, Project, ts } from 'ts-morph';

/**
 * Applies simple find-and-replace operations on TypeScript content.
 * This is used as Phase 1 of the template extraction process, before
 * delimiter-based extraction.
 *
 * @param content - The source code content to process
 * @param replacements - Map of values to replace with TPL variable names
 * @returns The content with simple replacements applied
 */
export function applySimpleReplacements(
  content: string,
  replacements: Record<string, string>,
): string {
  // Sort replacements by length (longest first) to avoid substring issues
  // For example, we want to replace "UserEditPage" before "User"
  const sortedReplacements = Object.entries(replacements).sort(
    ([a], [b]) => b.length - a.length,
  );

  // Validate all replacements upfront
  for (const [value, variable] of sortedReplacements) {
    if (!variable.startsWith('TPL_')) {
      throw new Error(
        `Template variable must start with TPL_: ${variable} (for value: ${value})`,
      );
    }
  }

  // Create a temporary ts-morph project to parse the content
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile('temp.ts', content);

  // Process each statement in the source file
  const statements = sourceFile.getStatementsWithComments();

  for (const statement of statements) {
    if (Node.isImportDeclaration(statement)) continue;

    // Process non-import statements with replacements
    const statementText = statement.getText();
    let newStatementText = statementText;

    for (const [value, variable] of sortedReplacements) {
      newStatementText = applyReplacementToText(
        newStatementText,
        value,
        variable,
      );
    }

    if (newStatementText !== statementText) {
      statement.replaceWithText(newStatementText);
    }
  }

  return sourceFile.getFullText();
}

/**
 * Applies a single replacement to the given text
 */
function applyReplacementToText(
  text: string,
  value: string,
  variable: string,
): string {
  const escapedValue = escapeRegExp(value);

  if (isStringLiteral(value)) {
    // For string literals (like paths), match them within quotes
    // This handles both single and double quotes, and template literals
    const patterns = [`'${value}'`, `"${value}"`, `\`${value}\``];

    let result = text;
    for (const pattern of patterns) {
      result = result.replaceAll(pattern, (match) => {
        const quote = match[0];
        return `${quote}${variable}${quote}`;
      });
    }
    return result;
  } else {
    // For other values, do exact matching with word boundaries where possible
    const regex = new RegExp(`\\b${escapedValue}\\b`, 'g');
    return text.replace(regex, variable);
  }
}

/**
 * Checks if a value looks like a string literal (contains non-identifier characters)
 */
function isStringLiteral(value: string): boolean {
  // String literals often contain special characters like /, -, spaces, etc.
  return /[^a-zA-Z0-9$_]/.test(value);
}
