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

  return {
    start: '{{',
    end: '}}',
  };
}

/**
 * Get the regex for a text template variable. We check for non-alphanumeric characters around the variable name.
 *
 * @param variable The variable to get the regex for.
 * @param value The value of the variable.
 * @returns The regex for the text template variable.
 */
export function getTextTemplateVariableRegExp(value: string): RegExp {
  return new RegExp(`(?<!\\w)${escapeRegExp(value)}(?!\\w)`, 'g');
}
