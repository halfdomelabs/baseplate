import { escapeRegExp } from 'es-toolkit';

/**
 * Get the delimiters for a text template file.
 * @param filename The filename of the text template file.
 * @returns The delimiters for the text template file.
 */
export function getTextTemplateDelimiters(filename: string): {
  start: string;
  end: string;
} {
  if (filename.endsWith('.css')) {
    return {
      start: '/* ',
      end: ' */',
    };
  }

  // no delimiters for gql files
  if (filename.endsWith('.gql')) {
    return {
      start: '',
      end: '',
    };
  }

  if (filename.endsWith('.yml') || filename.endsWith('.yaml')) {
    return {
      start: '${{',
      end: '}}',
    };
  }

  return {
    start: '{{',
    end: '}}',
  };
}

/**
 * Get the regex for a text template variable. We check for non-alphanumeric characters around the variable name.
 *
 * @param value The value of the variable.
 * @returns The regex for the text template variable.
 */
export function getTextTemplateVariableRegExp(value: string): RegExp {
  return new RegExp(`(?<!\\w)${escapeRegExp(value)}(?!\\w)`, 'g');
}

/**
 * Extract template variables from content by replacing variable values with template placeholders.
 *
 * @param contents The content to process.
 * @param variables The variables with their values to replace.
 * @param filename The filename for delimiter detection.
 * @returns The processed content with variables replaced by template placeholders.
 */
export function extractTemplateVariables(
  contents: string,
  variables: Record<string, string> | undefined,
  filename: string,
): string {
  if (!variables) {
    return contents;
  }

  let templateContents = contents;
  const { start, end } = getTextTemplateDelimiters(filename);

  // Sort variables by descending length of their values to prevent overlapping replacements
  const sortedVariables = Object.entries(variables).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  for (const [key, value] of sortedVariables) {
    const variableRegex = getTextTemplateVariableRegExp(value);
    const newTemplateContents = templateContents.replaceAll(
      variableRegex,
      `${start}${key}${end}`,
    );
    if (newTemplateContents === templateContents) {
      throw new Error(`Variable ${key} with value ${value} not found`);
    }
    templateContents = newTemplateContents;
  }

  return templateContents;
}
