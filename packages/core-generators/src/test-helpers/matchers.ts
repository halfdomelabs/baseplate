import { expect } from 'vitest';

import type {
  TsCodeFragment,
  TsImportDeclaration,
  TsNamedImport,
} from '../renderers/typescript/index.js';

import { areFragmentsEqual, normalizeFragment } from './utils.js';

/**
 * Options for toMatchTsFragment matcher
 */
export interface ToMatchTsFragmentOptions {
  /**
   * Whether to ignore hoisted fragments in comparison (default: false)
   */
  ignoreHoistedFragments?: boolean;
}

/**
 * Options for toIncludeImport matcher
 */
export interface ToIncludeImportOptions {
  /**
   * Whether the import should be type-only
   */
  isTypeOnly?: boolean;
}

/**
 * Formats imports for display in error messages
 */
function formatImports(imports?: TsImportDeclaration[]): string {
  if (!imports || imports.length === 0) return '(none)';

  return imports
    .map((imp) => {
      const parts: string[] = [];

      if (imp.isTypeOnly) parts.push('type');

      if (imp.namespaceImport) {
        parts.push(`* as ${imp.namespaceImport}`);
      }

      if (imp.defaultImport) {
        parts.push(imp.defaultImport);
      }

      if (imp.namedImports && imp.namedImports.length > 0) {
        const namedStr = imp.namedImports
          .map((ni) => (ni.alias ? `${ni.name} as ${ni.alias}` : ni.name))
          .join(', ');
        parts.push(`{ ${namedStr} }`);
      }

      return `  ${parts.join(' ')} from '${imp.moduleSpecifier}'`;
    })
    .join('\n');
}

/**
 * Formats hoisted fragments for display in error messages
 */
function formatHoistedFragments(
  fragments?: { key: string; contents: string }[],
): string {
  if (!fragments || fragments.length === 0) return '(none)';

  return fragments
    .map((frag) => `  [${frag.key}]: ${frag.contents}`)
    .join('\n');
}

/**
 * Checks if an import declaration contains a specific named import
 */
function hasNamedImport(
  imp: TsImportDeclaration,
  name: string,
  options?: ToIncludeImportOptions,
): boolean {
  if (!imp.namedImports) return false;

  return imp.namedImports.some((ni: TsNamedImport) => {
    if (ni.name !== name) return false;

    // If isTypeOnly is specified in options, check it matches
    if (options?.isTypeOnly !== undefined) {
      // Check both the named import level and the declaration level
      const isImportTypeOnly = ni.isTypeOnly ?? imp.isTypeOnly ?? false;
      return isImportTypeOnly === options.isTypeOnly;
    }

    return true;
  });
}

/**
 * Custom Vitest matchers for TypeScript code fragments
 */
export const fragmentMatchers = {
  /**
   * Asserts that a TypeScript fragment matches the expected fragment
   * Compares contents, imports (order-independent), and optionally hoisted fragments
   *
   * @example
   * ```typescript
   * expect(actualFragment).toMatchTsFragment(expectedFragment);
   * expect(actualFragment).toMatchTsFragment(expectedFragment, {
   *   ignoreHoistedFragments: true
   * });
   * ```
   */
  toMatchTsFragment(
    this: { isNot: boolean },
    received: TsCodeFragment,
    expected: TsCodeFragment,
    options?: ToMatchTsFragmentOptions,
  ) {
    const { isNot } = this;

    // Normalize both fragments for comparison
    const normalizedReceived = normalizeFragment(received, {
      compareHoistedFragments: !options?.ignoreHoistedFragments,
    });
    const normalizedExpected = normalizeFragment(expected, {
      compareHoistedFragments: !options?.ignoreHoistedFragments,
    });

    // Check equality
    const pass = areFragmentsEqual(received, expected, {
      compareHoistedFragments: !options?.ignoreHoistedFragments,
    });

    return {
      pass,
      message: () => {
        if (pass && isNot) {
          return 'Expected fragments not to be equal';
        }

        const messages: string[] = ['Expected fragments to be equal'];

        // Check contents
        if (normalizedReceived.contents !== normalizedExpected.contents) {
          messages.push(
            '',
            'Contents:',
            `  Expected: ${normalizedExpected.contents}`,
            `  Received: ${normalizedReceived.contents}`,
          );
        }

        // Check imports
        const receivedImportsStr = formatImports(normalizedReceived.imports);
        const expectedImportsStr = formatImports(normalizedExpected.imports);

        if (receivedImportsStr !== expectedImportsStr) {
          messages.push(
            '',
            'Imports:',
            'Expected:',
            expectedImportsStr,
            'Received:',
            receivedImportsStr,
          );
        }

        // Check hoisted fragments if not ignored
        if (!options?.ignoreHoistedFragments) {
          const receivedHoistedStr = formatHoistedFragments(
            normalizedReceived.hoistedFragments,
          );
          const expectedHoistedStr = formatHoistedFragments(
            normalizedExpected.hoistedFragments,
          );

          if (receivedHoistedStr !== expectedHoistedStr) {
            messages.push(
              '',
              'Hoisted Fragments:',
              'Expected:',
              expectedHoistedStr,
              'Received:',
              receivedHoistedStr,
            );
          }
        }

        return messages.join('\n');
      },
    };
  },

  /**
   * Asserts that a fragment includes a specific import
   *
   * @example
   * ```typescript
   * expect(fragment).toIncludeImport('z', 'zod');
   * expect(fragment).toIncludeImport('Prisma', '@prisma/client', { isTypeOnly: true });
   * ```
   */
  toIncludeImport(
    this: { isNot: boolean },
    received: TsCodeFragment,
    name: string,
    from: string,
    options?: ToIncludeImportOptions,
  ) {
    const { isNot } = this;

    const imports = received.imports ?? [];
    const matchingImport = imports.find((imp) => imp.moduleSpecifier === from);

    const pass =
      matchingImport !== undefined &&
      hasNamedImport(matchingImport, name, options);

    return {
      pass,
      message: () => {
        if (pass && isNot) {
          const typeOnlyStr = options?.isTypeOnly ? ' (type-only)' : '';
          return `Expected not to include import "${name}"${typeOnlyStr} from "${from}"`;
        }

        const typeOnlyStr = options?.isTypeOnly ? ' (type-only)' : '';
        const foundFrom = matchingImport
          ? `, but found import from "${matchingImport.moduleSpecifier}"`
          : '';

        return [
          `Expected to include import "${name}"${typeOnlyStr} from "${from}"${foundFrom}`,
          '',
          'Available imports:',
          formatImports(imports),
        ].join('\n');
      },
    };
  },
};

/**
 * Extends Vitest's expect with custom matchers for TypeScript fragments
 * Call this function once in your test setup to enable the matchers
 *
 * @example
 * ```typescript
 * // In test setup file or at the top of test file
 * import { extendFragmentMatchers } from '@baseplate-dev/core-generators/test-helpers';
 *
 * extendFragmentMatchers();
 * ```
 */
export function extendFragmentMatchers(): void {
  expect.extend(fragmentMatchers);
}

/**
 * TypeScript module augmentation for custom matchers
 * This provides type checking and autocomplete for the custom matchers
 */
interface FragmentMatchers<R = unknown> {
  /**
   * Asserts that a TypeScript fragment matches the expected fragment
   * Compares contents, imports (order-independent), and optionally hoisted fragments
   */
  toMatchTsFragment(
    expected: TsCodeFragment,
    options?: ToMatchTsFragmentOptions,
  ): R;
  /**
   * Asserts that a fragment includes a specific import
   */
  toIncludeImport(
    name: string,
    from: string,
    options?: ToIncludeImportOptions,
  ): R;
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  interface Matchers<T = any> extends FragmentMatchers<T> {}
}
