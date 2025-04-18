import { sortBy } from 'es-toolkit';

import type { TsCodeFragmentOptions } from './fragments/creators.js';
import type { TsCodeFragment, TsHoistedFragment } from './fragments/types.js';
import type { TsImportDeclarationBuilder } from './imports/builder.js';
import type { TsImportDeclaration } from './imports/types.js';

import { tsCodeFragment } from './fragments/creators.js';
import { tsImportBuilder } from './imports/builder.js';

function formatStringWithContent(
  str: string,
  args: Partial<Record<string, TsCodeFragment | string>>,
): string {
  if (Object.keys(args).some((key) => !/^[A-Z0-9_-]+$/.test(key))) {
    throw new Error('All arguments for format must follow [A-Z0-9_-]');
  }
  const regex = new RegExp(`(${Object.keys(args).join('|')})`, 'g');
  return str.replace(regex, (key) => {
    const entry = args[key];
    if (entry === undefined) {
      throw new Error(`Could not find entry for ${key}`);
    }
    return typeof entry === 'string' ? entry : entry.contents;
  });
}

function isTsCodeFragment(value: unknown): value is TsCodeFragment {
  return typeof value === 'object' && value !== null && 'contents' in value;
}

function mergeFragmentImportsAndHoistedFragments(fragments: TsCodeFragment[]): {
  imports: TsImportDeclaration[];
  hoistedFragments: TsHoistedFragment[];
} {
  return {
    imports: fragments.flatMap((f) => f.imports ?? []),
    hoistedFragments: fragments.flatMap((f) => f.hoistedFragments ?? []),
  };
}

/**
 * Utility functions for working with TypeScript code fragments.
 */
export const TsCodeUtils = {
  /**
   * Create a code fragment from a string.
   * @param contents - The contents of the code fragment.
   * @returns The code fragment.
   */
  frag(
    contents: string,
    imports?: TsImportDeclaration[] | TsImportDeclaration,
    options?: TsCodeFragmentOptions,
  ): TsCodeFragment {
    return tsCodeFragment(contents, imports, options);
  },
  /**
   * Create an import builder.
   * @param namedImports - The named imports to add to the import builder.
   * @returns The import builder.
   */
  importBuilder(namedImports?: string[]): TsImportDeclarationBuilder {
    return tsImportBuilder(namedImports);
  },
  /**
   * Shortcut function for creating a fragment that imports a named import from a module.
   * @param name - The name of the import.
   * @param importFrom - The module to import from.
   * @returns The import fragment.
   */
  importFragment(name: string, importFrom: string): TsCodeFragment {
    return tsCodeFragment(name, tsImportBuilder([name]).from(importFrom));
  },
  /**
   * Merge a map of code fragments into a single code fragment. We by default use
   * maps to ensure that the order of the fragments is deterministic since the
   * code fragments are merged by the order of the keys.
   *
   * @param fragments - The code fragments to merge.
   * @param separator - The separator to use between the fragments.
   * @returns The merged code fragment.
   */
  mergeFragments(
    fragments: Map<string, TsCodeFragment | string>,
    separator = '\n',
  ): TsCodeFragment {
    const sortedFragmentEntries = sortBy(
      [...fragments.entries()],
      [([key]) => key],
    );
    return {
      contents: sortedFragmentEntries
        .map(([, fragment]) =>
          typeof fragment === 'string' ? fragment : fragment.contents,
        )
        .join(separator),
      ...mergeFragmentImportsAndHoistedFragments(
        sortedFragmentEntries
          .map(([, fragment]) => fragment)
          .filter(isTsCodeFragment),
      ),
    };
  },

  /**
   * Merge an array of code fragments into a single code fragment.
   *
   * NOTE: Be careful about using this function since the order of the fragments may not
   * be deterministic so fragments should be presorted before using.
   *
   * @param fragments - The code fragments to merge.
   * @param separator - The separator to use between the fragments.
   * @returns The merged code fragment.
   */
  mergeFragmentsPresorted(
    fragments: (TsCodeFragment | string)[],
    separator = '\n',
  ): TsCodeFragment {
    return {
      contents: fragments
        .map((f) => (typeof f === 'string' ? f : f.contents))
        .join(separator),
      ...mergeFragmentImportsAndHoistedFragments(
        fragments.filter(isTsCodeFragment),
      ),
    };
  },

  /**
   * Format a string as a comment.
   * @param text - The text to format.
   * @returns The formatted text.
   */
  formatAsComment(text: string): string {
    return text
      .split('\n')
      .map((line) => `// ${line}`)
      .join('\n');
  },

  /**
   * Format a string with content.
   * @param formatString - The string to format.
   * @param args - The arguments to format the string with.
   * @returns The formatted string.
   */
  formatFragment(
    formatString: string,
    args: Record<string, TsCodeFragment | string>,
  ): TsCodeFragment {
    return {
      contents: formatStringWithContent(formatString, args),
      ...mergeFragmentImportsAndHoistedFragments(
        Object.values(args).filter(isTsCodeFragment),
      ),
    };
  },

  /**
   * Merge an object of code fragments into a single code fragment.
   *
   * Keys are sorted by default for persistence.
   *
   * @param obj - The object to merge.
   * @param options - The options for the merge.
   * @returns The merged code fragment.
   */
  mergeFragmentsAsObject(
    objOrMap:
      | Record<string, TsCodeFragment | string | undefined>
      | Map<string, TsCodeFragment | string | undefined>,
    options: {
      wrapWithParenthesis?: boolean;
      disableSort?: boolean;
    } = {},
  ): TsCodeFragment {
    const { wrapWithParenthesis = false, disableSort = false } = options;
    const map =
      objOrMap instanceof Map ? objOrMap : new Map(Object.entries(objOrMap));
    const keys = [...map.keys()];
    const fragments = [...map.values()].filter(isTsCodeFragment);

    const sortedKeys = disableSort ? keys : keys.toSorted();

    if (!disableSort && keys.some((k) => k.startsWith('...'))) {
      throw new Error('Cannot have spread keys when sorting is enabled');
    }

    const mergedContent = sortedKeys
      .filter((key) => map.get(key))
      .map((key) => {
        const value = map.get(key) ?? '';
        const content = typeof value === 'string' ? value : value.contents;
        const trimmedContent = content.trim();

        if (key.startsWith('...')) {
          return `...${trimmedContent},`;
        }
        if (key === trimmedContent) {
          return `${trimmedContent},`;
        }
        if (trimmedContent.startsWith(`function ${key}`)) {
          return `${trimmedContent.replace(/^function /, '')},`;
        }
        if (trimmedContent.startsWith(`async function ${key}`)) {
          return `${trimmedContent.replace(/^async function /, 'async ')},`;
        }
        const escapedKey = /^[A-Z0-9_a-z]+$/.test(key)
          ? key
          : `"${key.replaceAll('"', String.raw`\"`)}"`;
        return `${escapedKey}: ${content},`;
      })
      .join('\n');

    return {
      contents: wrapWithParenthesis
        ? `({${mergedContent}})`
        : `{${mergedContent}}`,
      ...mergeFragmentImportsAndHoistedFragments(fragments),
    };
  },

  /**
   * Merge a map of code fragments into an array literal. The fragments are sorted by key
   * to ensure deterministic output.
   *
   * @param fragments - The code fragments to merge.
   * @returns The merged code fragment as an array literal.
   */
  mergeFragmentsAsArray(
    fragments: Map<string, TsCodeFragment | string>,
  ): TsCodeFragment {
    const sortedFragmentEntries = sortBy(
      [...fragments.entries()],
      [([key]) => key],
    );
    return {
      contents: `[${sortedFragmentEntries
        .map(([, fragment]) =>
          typeof fragment === 'string' ? fragment : fragment.contents,
        )
        .join(',\n')}]`,
      ...mergeFragmentImportsAndHoistedFragments(
        sortedFragmentEntries
          .map(([, fragment]) => fragment)
          .filter(isTsCodeFragment),
      ),
    };
  },

  /**
   * Wrap a code fragment with a string.
   * @param fragment - The code fragment to wrap.
   * @param wrapper - The string to wrap the code fragment with.
   * @returns The wrapped code fragment.
   */
  wrapFragment(fragment: TsCodeFragment, wrapper: string): TsCodeFragment {
    return {
      contents: wrapper.replace('CONTENTS', fragment.contents),
      imports: fragment.imports,
      hoistedFragments: fragment.hoistedFragments,
    };
  },

  /**
   * Creates a template string function that processes template literals with embedded expressions.
   * Similar to the standard template literals, but handles TsCodeFragment objects and collects their imports.
   *
   * @param strings The string parts of the template
   * @param expressions The expressions to be interpolated between the string parts
   * @returns A new TsCodeFragment with the combined content and collected imports
   *
   * @example
   * const name = 'world';
   * const greeting = tsCodeFragment('Hello');
   * const result = template`${greeting}, ${name}!`;
   * // result.contents will be "Hello, world!"
   * // result.imports will include any imports from the greeting fragment
   */
  template(
    strings: TemplateStringsArray,
    ...expressions: (TsCodeFragment | string)[]
  ): TsCodeFragment {
    const fragments = expressions.filter(isTsCodeFragment);
    const result: string[] = [];

    // Interleave the strings with the expressions
    for (const [i, str] of strings.entries()) {
      result.push(str);

      if (i < expressions.length) {
        const expr = expressions[i];
        result.push(typeof expr === 'string' ? expr : expr.contents);
      }
    }

    return {
      contents: result.join(''),
      ...mergeFragmentImportsAndHoistedFragments(fragments),
    };
  },

  templateWithImports(
    imports?: TsImportDeclaration[] | TsImportDeclaration,
  ): (
    strings: TemplateStringsArray,
    ...expressions: (TsCodeFragment | string)[]
  ) => TsCodeFragment {
    return (strings, ...expressions) =>
      this.template(strings, ...expressions, {
        contents: '',
        imports: Array.isArray(imports) ? imports : imports ? [imports] : [],
      });
  },
};
