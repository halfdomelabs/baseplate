/**
 * Vitest snapshot serializer for TsCodeFragment
 *
 * Produces readable snapshots that look like actual TypeScript code output.
 *
 * @example
 * ```typescript
 * // In test setup file
 * import { extendFragmentSerializer } from '@baseplate-dev/core-generators/test-helpers';
 *
 * extendFragmentSerializer();
 *
 * // In tests
 * expect(fragment).toMatchSnapshot();
 * ```
 *
 * @packageDocumentation
 */

import { expect } from 'vitest';

import type {
  TsCodeFragment,
  TsImportDeclaration,
} from '../renderers/typescript/index.js';

import { normalizeFragment } from './utils.js';

/**
 * Type guard to detect TsCodeFragment objects
 */
function isTsCodeFragment(val: unknown): val is TsCodeFragment {
  return (
    val !== null &&
    typeof val === 'object' &&
    'contents' in val &&
    typeof (val as TsCodeFragment).contents === 'string'
  );
}

/**
 * Formats a single import declaration as a TypeScript import statement
 */
function formatImportStatement(imp: TsImportDeclaration): string {
  const parts: string[] = [];

  if (imp.namespaceImport) {
    parts.push(`* as ${imp.namespaceImport}`);
  }

  if (imp.defaultImport) {
    parts.push(imp.defaultImport);
  }

  if (imp.namedImports && imp.namedImports.length > 0) {
    const namedStr = imp.namedImports
      .map((ni) => {
        const name = ni.alias ? `${ni.name} as ${ni.alias}` : ni.name;
        return ni.isTypeOnly ? `type ${name}` : name;
      })
      .join(', ');
    parts.push(`{ ${namedStr} }`);
  }

  const importKeyword = imp.isTypeOnly ? 'import type' : 'import';
  return `${importKeyword} ${parts.join(', ')} from '${imp.moduleSpecifier}';`;
}

/**
 * Indents all lines in a string
 */
function indentLines(text: string, indent: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `${indent}${line}` : line))
    .join('\n');
}

/**
 * Serializes a TsCodeFragment to TypeScript-like output
 */
function serializeFragment(
  fragment: TsCodeFragment,
  baseIndent: string,
  indentUnit: string,
): string {
  const normalized = normalizeFragment(fragment);
  const lines: string[] = [];

  // Hoisted fragments (if present) - each as "Hoisted [key]:"
  if (normalized.hoistedFragments && normalized.hoistedFragments.length > 0) {
    for (const frag of normalized.hoistedFragments) {
      lines.push(`${baseIndent}Hoisted [${frag.key}]:`);
      // Recursively serialize the hoisted fragment
      const nestedOutput = serializeFragment(
        frag,
        baseIndent + indentUnit,
        indentUnit,
      );
      lines.push(nestedOutput, ''); // blank line between hoisted fragments
    }
  }

  // Import statements (if present)
  if (normalized.imports && normalized.imports.length > 0) {
    for (const imp of normalized.imports) {
      lines.push(`${baseIndent}${formatImportStatement(imp)}`);
    }
    lines.push(''); // blank line after imports
  }

  // Fragment contents
  lines.push(indentLines(normalized.contents, baseIndent));

  return lines.join('\n');
}

/**
 * Vitest snapshot serializer for TsCodeFragment
 *
 * Produces TypeScript-like snapshots showing:
 * - Hoisted fragments (if any) as nested TsCodeFragment blocks
 * - Import statements as actual TypeScript import syntax
 * - Fragment contents as code
 */
export const tsFragmentSerializer = {
  /**
   * Tests if the value is a TsCodeFragment
   */
  test(val: unknown): boolean {
    return isTsCodeFragment(val);
  },

  /**
   * Serializes a TsCodeFragment to a readable string format
   */
  serialize(
    val: TsCodeFragment,
    config: { indent: string },
    indentation: string,
  ): string {
    return serializeFragment(val, indentation, config.indent);
  },
};

/**
 * Extends Vitest with the TsCodeFragment snapshot serializer
 * Call this function once in your test setup to enable the serializer
 *
 * @example
 * ```typescript
 * // In test setup file or at the top of test file
 * import { extendFragmentSerializer } from '@baseplate-dev/core-generators/test-helpers';
 *
 * extendFragmentSerializer();
 * ```
 */
export function extendFragmentSerializer(): void {
  expect.addSnapshotSerializer(tsFragmentSerializer);
}
