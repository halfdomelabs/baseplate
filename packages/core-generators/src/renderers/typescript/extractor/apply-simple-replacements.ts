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

    // Use word boundary matching for identifiers to prevent incorrect replacements
    // For example, "User" shouldn't match in "UserProfile" or "CurrentUser"
    const escapedValue = escapeRegExp(value);

    // Different replacement strategies based on the type of value
    if (isStringLiteral(value)) {
      // For string literals (like paths), match them within quotes
      // This handles both single and double quotes, and template literals
      const patterns = [
        new RegExp(`(?<!^\\s*import .+)'${escapedValue}'`, 'gm'),
        new RegExp(`(?<!^\\s*import .+)"${escapedValue}"`, 'gm'),
        new RegExp(`(?<!^\\s*import .+)\`${escapedValue}\``, 'gm'),
      ];

      for (const pattern of patterns) {
        result = result.replace(pattern, (match) => {
          const quote = match[0];
          return `${quote}${variable}${quote}`;
        });
      }
    } else {
      // For other values, do exact matching with word boundaries where possible
      // We want to skip import statements to ensure that our unused import logic remains correct
      const regex = new RegExp(
        `(?<!^\\s*import .+)\\b${escapedValue}\\b`,
        'gm',
      );
      result = result.replace(regex, variable);
    }
  }

  return result;
}

/**
 * Checks if a value looks like a string literal (contains non-identifier characters)
 */
function isStringLiteral(value: string): boolean {
  // String literals often contain special characters like /, -, spaces, etc.
  return /[^a-zA-Z0-9$_]/.test(value);
}
