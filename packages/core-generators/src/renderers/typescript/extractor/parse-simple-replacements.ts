/**
 * Parser for simple TPL replacement comments in TypeScript templates.
 *
 * Extracts comments in the format: `/* TPL_VAR_NAME=value *\/`
 * and returns a mapping for simple replacements.
 */

const SIMPLE_REPLACEMENT_REGEX = /\/\* TPL_([A-Z0-9_]+)=([^*]*?) \*\/\n*/g;
const ALLOWED_VALUE_PATTERN = /^[a-zA-Z0-9_$/./-]+$/;

interface ParseSimpleReplacementsResult {
  /** Content with replacement comments removed */
  content: string;
  /** Map of values to TPL variable names for replacement */
  replacements: Record<string, string>;
}

/**
 * Parses simple replacement comments from TypeScript template content.
 *
 * @param content - The template content to parse
 * @returns Object with cleaned content and replacement mappings
 * @throws Error if replacement values contain unsupported characters
 */
export function parseSimpleReplacements(
  content: string,
): ParseSimpleReplacementsResult {
  const replacements: Record<string, string> = {};

  const cleanedContent = content.replaceAll(
    SIMPLE_REPLACEMENT_REGEX,
    (match, varName: string, value: string) => {
      // Validate that the variable name is valid (already captured by regex, but double-check)
      if (!/^[A-Z0-9_]+$/.test(varName)) {
        throw new Error(
          `Invalid variable name: TPL_${varName}. Variable names must contain only uppercase letters, numbers, and underscores.`,
        );
      }

      // Validate that the value contains only allowed characters
      if (!ALLOWED_VALUE_PATTERN.test(value)) {
        throw new Error(
          `Invalid replacement value "${value}" for TPL_${varName}. ` +
            `Values can only contain: a-zA-Z0-9_$/./-. ` +
            `For complex values, use delimiter-based variables instead: ` +
            `/* TPL_${varName}:START */.../* TPL_${varName}:END */`,
        );
      }

      const fullVariableName = `TPL_${varName}`;

      // Check for duplicate variable names
      if (Object.values(replacements).includes(fullVariableName)) {
        throw new Error(`Duplicate variable name: ${fullVariableName}`);
      }

      // Check for duplicate values (which could cause ambiguous replacements)
      if (value in replacements) {
        throw new Error(
          `Duplicate replacement value "${value}" for TPL_${varName}. ` +
            `Value is already used for ${replacements[value]}. Each value must be unique.`,
        );
      }

      replacements[value] = fullVariableName;

      // Remove the comment entirely (including any trailing newline)
      return '';
    },
  );

  return {
    content: cleanedContent,
    replacements,
  };
}

/**
 * Generates sorted simple replacement comments for writing to template files.
 *
 * @param replacements - Map of values to TPL variable names
 * @returns Array of comment strings, sorted alphabetically by variable name
 */
export function generateSimpleReplacementComments(
  replacements: Record<string, string>,
): string[] {
  return Object.entries(replacements)
    .sort(([, a], [, b]) => a.localeCompare(b)) // Sort by variable name
    .map(([value, variable]) => {
      // Extract just the part after TPL_
      const varName = variable.replace(/^TPL_/, '');
      return `/* TPL_${varName}=${value} */`;
    });
}

/**
 * Validates that a replacement value is supported for simple replacements.
 *
 * @param value - The value to validate
 * @returns true if the value is valid for simple replacement
 */
export function isValidSimpleReplacementValue(value: string): boolean {
  return ALLOWED_VALUE_PATTERN.test(value);
}
