import { escapeRegExp } from 'es-toolkit';
import { Node, Project } from 'ts-morph';

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
      jsx: 1, // JsxEmit.React
    },
    useInMemoryFileSystem: true,
  });

  const sourceFile = project.createSourceFile('temp.ts', content, {
    overwrite: true,
  });

  // Process each statement in the source file
  const statements = sourceFile.getStatements();
  const processedStatements: string[] = [];

  for (const statement of statements) {
    if (Node.isImportDeclaration(statement)) {
      // Skip import statements - preserve them as-is
      processedStatements.push(statement.getFullText());
    } else {
      // Process non-import statements with replacements
      let statementText = statement.getFullText();

      for (const [value, variable] of sortedReplacements) {
        statementText = applyReplacementToText(statementText, value, variable);
      }

      processedStatements.push(statementText);
    }
  }

  // Handle any leading trivia (comments, whitespace) before the first statement
  let leadingTrivia = '';
  if (statements.length > 0) {
    const firstStatement = statements[0];
    const startPos = firstStatement.getPos();
    if (startPos > 0) {
      leadingTrivia = content.slice(0, startPos);
    }
  }

  return leadingTrivia + processedStatements.join('');
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
    const patterns = [
      new RegExp(`'${escapedValue}'`, 'g'),
      new RegExp(`"${escapedValue}"`, 'g'),
      new RegExp(`\`${escapedValue}\``, 'g'),
    ];

    let result = text;
    for (const pattern of patterns) {
      result = result.replace(pattern, (match) => {
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
