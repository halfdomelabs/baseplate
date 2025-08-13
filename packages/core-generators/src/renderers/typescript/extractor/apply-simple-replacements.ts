import { escapeRegExp } from 'es-toolkit';

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
  let result = content;

  // Sort replacements by length (longest first) to avoid substring issues
  // For example, we want to replace "UserEditPage" before "User"
  const sortedReplacements = Object.entries(replacements).sort(
    ([a], [b]) => b.length - a.length,
  );

  for (const [value, variable] of sortedReplacements) {
    // Validate that the variable name follows TPL_ convention
    if (!variable.startsWith('TPL_')) {
      throw new Error(
        `Template variable must start with TPL_: ${variable} (for value: ${value})`,
      );
    }

    // Process all lines with the current replacement
    const lines = result.split('\n');
    const processedLines = lines.map((line) =>
      processLine(line, value, variable),
    );
    result = processedLines.join('\n');
  }

  return result;
}

/**
 * Processes a single line with the given replacement value and variable
 */
function processLine(line: string, value: string, variable: string): string {
  // Skip import and export lines to preserve unused import detection
  if (/^\s*(import|export\s+.*from)\s+/.test(line)) {
    return line;
  }

  const escapedValue = escapeRegExp(value);

  if (isStringLiteral(value)) {
    // For string literals (like paths), match them within quotes
    // This handles both single and double quotes, and template literals
    const patterns = [
      new RegExp(`'${escapedValue}'`, 'g'),
      new RegExp(`"${escapedValue}"`, 'g'),
      new RegExp(`\`${escapedValue}\``, 'g'),
    ];

    let processedLine = line;
    for (const pattern of patterns) {
      processedLine = processedLine.replace(pattern, (match) => {
        const quote = match[0];
        return `${quote}${variable}${quote}`;
      });
    }
    return processedLine;
  } else {
    // For other values, do exact matching with word boundaries where possible
    const regex = new RegExp(`\\b${escapedValue}\\b`, 'g');
    return line.replace(regex, variable);
  }
}

/**
 * Checks if a value looks like a string literal (contains non-identifier characters)
 */
function isStringLiteral(value: string): boolean {
  // String literals often contain special characters like /, -, spaces, etc.
  return /[^a-zA-Z0-9$_]/.test(value);
}
