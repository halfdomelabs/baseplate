import { quot } from '@halfdomelabs/utils';
import { sortBy } from 'es-toolkit';

import type { TsCodeFragmentOptions } from '../fragments/creators.js';
import type { TsCodeFragment, TsHoistedFragment } from '../fragments/types.js';
import type { TsImportDeclarationBuilder } from '../imports/builder.js';
import type { TsImportDeclaration } from '../imports/types.js';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';

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

export function mergeFragmentImportsAndHoistedFragments(
  fragments: TsCodeFragment[],
  options?: {
    imports?: TsImportDeclaration[];
    hoistedFragments?: TsHoistedFragment[];
  },
): {
  imports: TsImportDeclaration[];
  hoistedFragments: TsHoistedFragment[];
} {
  return {
    imports: [
      ...(options?.imports ?? []),
      ...fragments.flatMap((f) => f.imports ?? []),
    ],
    hoistedFragments: [
      ...(options?.hoistedFragments ?? []),
      ...fragments.flatMap((f) => f.hoistedFragments ?? []),
    ],
  };
}

/**
 * Validate a property key and strips out unnecessary quotes.
 *
 * Property keys must be valid identifiers or quoted strings and may optionally end with a question mark.
 *
 * @param key - The key to validate.
 * @throws An error if the key is invalid.
 */
function validatePropertyKey(key: string): string {
  const quotedKeyRegex = /^(['"])[^]*\1\??$/;
  const unquotedKeyRegex = /^[A-Za-z0-9_]+\??$/;

  const isQuoted = quotedKeyRegex.test(key);
  const isValidUnquoted = unquotedKeyRegex.test(key);

  if (!isQuoted && !isValidUnquoted) {
    throw new Error(`Invalid key: ${key}. Please escape the key with quotes.`);
  }

  const unnecessaryQuoteRegex = /^(['"])[A-Za-z0-9_]+\1\??$/;
  if (isQuoted && unnecessaryQuoteRegex.test(key)) {
    return key.slice(1, -1);
  }

  return key;
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
    fragments:
      | Map<string, TsCodeFragment | string | undefined>
      | Record<string, TsCodeFragment | string | undefined>,
    separator = '\n',
  ): TsCodeFragment {
    const map =
      fragments instanceof Map ? fragments : new Map(Object.entries(fragments));
    const sortedFragmentEntries = sortBy([...map.entries()], [([key]) => key]);
    return {
      contents: sortedFragmentEntries
        .map(([, fragment]) => fragment)
        .filter((f) => f !== undefined)
        .map((fragment) =>
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
    imports?: TsImportDeclaration[] | TsImportDeclaration,
    options?: {
      hoistedFragments?: TsHoistedFragment[];
    },
  ): TsCodeFragment {
    return {
      contents: formatStringWithContent(formatString, args),
      ...mergeFragmentImportsAndHoistedFragments(
        Object.values(args).filter(isTsCodeFragment),
        {
          imports: imports && (Array.isArray(imports) ? imports : [imports]),
          hoistedFragments: options?.hoistedFragments,
        },
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
      caseSensitive?: boolean;
    } = {},
  ): TsCodeFragment {
    const {
      wrapWithParenthesis = false,
      disableSort = false,
      caseSensitive = false,
    } = options;
    const map =
      objOrMap instanceof Map ? objOrMap : new Map(Object.entries(objOrMap));
    const keys = [...map.keys()];
    const fragments = [...map.values()].filter(isTsCodeFragment);

    const sortedKeys = disableSort
      ? keys
      : keys.toSorted(caseSensitive ? undefined : (a, b) => a.localeCompare(b));

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
        const escapedKey = /^[a-zA-Z0-9_]+$/.test(key) ? key : `'${key}'`;
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

  mergeFragmentsAsObjectPresorted(
    objOrMap:
      | Record<string, TsCodeFragment | string | undefined>
      | Map<string, TsCodeFragment | string | undefined>,
    options: {
      wrapWithParenthesis?: boolean;
    } = {},
  ): TsCodeFragment {
    return this.mergeFragmentsAsObject(objOrMap, {
      ...options,
      disableSort: true,
    });
  },

  /**
   * Merge a map of code fragments into interface content. The fragments are sorted by key
   * to ensure deterministic output.
   *
   * Add quotes around property keys that should be escaped and optional properties should be
   * marked with a question mark, e.g. 'complex-key'? for an optional property named complex-key.
   *
   * @param fragments - The code fragments to merge.
   * @param options - The options for the merge.
   * @returns The merged code fragment as interface content.
   */
  mergeFragmentsAsInterfaceContent(
    objOrMap:
      | Record<string, TsCodeFragment | string | undefined>
      | Map<string, TsCodeFragment | string | undefined>,
    options: {
      disableSort?: boolean;
      caseSensitive?: boolean;
    } = {},
  ): TsCodeFragment {
    const { disableSort = false, caseSensitive = false } = options;
    const map =
      objOrMap instanceof Map ? objOrMap : new Map(Object.entries(objOrMap));
    const keys = [...map.keys()];
    const fragments = [...map.values()].filter(isTsCodeFragment);

    const sortedKeys = disableSort
      ? keys
      : keys.toSorted(caseSensitive ? undefined : (a, b) => a.localeCompare(b));

    const mergedContent = sortedKeys
      .filter((key) => map.get(key))
      .map((key) => {
        const value = map.get(key) ?? '';
        const content = typeof value === 'string' ? value : value.contents;
        const validatedKey = validatePropertyKey(key);
        const escapedKey =
          validatedKey.startsWith('"') || validatedKey.startsWith("'")
            ? `[${validatedKey}]`
            : validatedKey;
        return `${escapedKey}: ${content};`;
      })
      .join('\n');

    return {
      contents: mergedContent,
      ...mergeFragmentImportsAndHoistedFragments(fragments),
    };
  },

  /**
   * Merge an array of code fragments into an array literal.
   *
   * @param fragments - The code fragments to merge.
   * @returns The merged code fragment as an array literal.
   */
  mergeFragmentsAsArrayPresorted(
    fragments: (string | TsCodeFragment)[],
  ): TsCodeFragment {
    return {
      contents: `[${fragments
        .map((fragment) =>
          typeof fragment === 'string' ? fragment : fragment.contents,
        )
        .join(',\n')}]`,
      ...mergeFragmentImportsAndHoistedFragments(
        fragments.filter(isTsCodeFragment),
      ),
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
    objOrMap:
      | Record<string, TsCodeFragment | string>
      | Map<string, TsCodeFragment | string>,
  ): TsCodeFragment {
    const map =
      objOrMap instanceof Map ? objOrMap : new Map(Object.entries(objOrMap));
    const sortedFragmentEntries = sortBy([...map.entries()], [([key]) => key]);
    return this.mergeFragmentsAsArrayPresorted(
      sortedFragmentEntries.map(([, fragment]) => fragment),
    );
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
      contents: result.join('').trim(),
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

  /**
   * Merge fragments into a JSX element.
   *
   * Attribute values depending on their type are handled differently:
   *
   * - `string`: The value is used as is and automatically escaped if it contains double quotes.
   * - `boolean`: The attribute is added to the JSX element if true, e.g.
   *   <Component showBlink /> if showBlink is true. If false, the attribute is
   *   not added.
   * - `TsCodeFragment`: The value is used as is inside { } braces, e.g.
   *   <Component foo={<div>bar</div>} />.
   *
   * @param name - The name of the JSX element.
   * @param attributes - The attributes of the JSX element.
   * @param imports - Optional imports to add to the fragment.
   * @returns The merged code fragment as a JSX element.
   */
  mergeFragmentsAsJsxElement(
    name: string,
    attributes: Record<string, TsCodeFragment | string | boolean | undefined>,
    imports?: TsImportDeclaration[] | TsImportDeclaration,
  ): TsCodeFragment {
    const { children, ...rest } = attributes;
    const keys = Object.keys(rest);
    const attributesStr = keys
      .filter((key) => rest[key] !== false && rest[key] !== undefined)
      .map((key) => {
        const value = rest[key];
        if (value === true) {
          return key;
        }
        if (typeof value === 'string') {
          return value.includes('"')
            ? `${key}={${quot(value)}}`
            : `${key}="${value}"`;
        }
        if (isTsCodeFragment(value)) {
          return `${key}={${value.contents}}`;
        }
        throw new Error(`Invalid value for attribute ${key}`);
      })
      .join(' ');

    const fragments = Object.values(attributes).filter(
      (value): value is TsCodeFragment => isTsCodeFragment(value),
    );

    if (typeof children === 'boolean') {
      throw new TypeError('children must be an expression');
    }

    const contents = children
      ? `<${name} ${attributesStr}>${
          typeof children === 'string' ? children : children.contents
        }</${name}>`
      : `<${name} ${attributesStr} />`;

    return {
      contents,
      ...mergeFragmentImportsAndHoistedFragments([
        ...fragments,
        {
          contents: '',
          imports: Array.isArray(imports) ? imports : imports ? [imports] : [],
        },
      ]),
    };
  },
};

// Shortcut for template function
export const tsTemplate = TsCodeUtils.template.bind(TsCodeUtils);
