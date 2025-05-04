import { escapeRegExp } from 'es-toolkit';

import type { TextTemplateFileVariable } from './types.js';

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
 * Get the regex for a text template variable.
 * @param variable The variable to get the regex for.
 * @returns The regex for the text template variable.
 */
export function getTextTemplateVariableRegExp(
  variable: TextTemplateFileVariable,
  value: string,
): RegExp {
  return variable.isIdentifier
    ? new RegExp(`(?<!\\w)${escapeRegExp(value)}(?!\\w)`, 'g')
    : new RegExp(escapeRegExp(value), 'g');
}
