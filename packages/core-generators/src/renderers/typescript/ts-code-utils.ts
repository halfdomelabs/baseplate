import type { TsCodeFragment, TsHoistedFragment } from './fragments/types.js';
import type { TsImportDeclaration } from './imports/types.js';

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

export const TsCodeUtils = {
  mergeFragments(
    fragments: TsCodeFragment[],
    separator = '\n',
  ): TsCodeFragment {
    return {
      contents: fragments.map((f) => f.contents).join(separator),
      ...mergeFragmentImportsAndHoistedFragments(fragments),
    };
  },

  formatAsComment(text: string): string {
    return text
      .split('\n')
      .map((line) => `// ${line}`)
      .join('\n');
  },

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

  mergeFragmentsAsObject(
    obj: Record<string, TsCodeFragment | string | undefined>,
    options: {
      wrapWithParenthesis?: boolean;
    } = {},
  ): TsCodeFragment {
    const { wrapWithParenthesis = false } = options;
    const keys = Object.keys(obj);
    const fragments = Object.values(obj).filter(isTsCodeFragment);

    const mergedContent = keys
      .filter((key) => obj[key] != null)
      .map((key) => {
        const value = obj[key] ?? '';
        const content = typeof value === 'string' ? value : value.contents;

        if (key.startsWith('...')) {
          return `...${content},`;
        }
        if (key === content) {
          return `${key},`;
        }
        if (content.startsWith(`function ${key}`)) {
          return content.replace(/^function /, '');
        }
        if (content.startsWith(`async function ${key}`)) {
          return content.replace(/^async function /, 'async ');
        }
        return `${key}: ${content},`;
      })
      .join('\n');

    return {
      contents: wrapWithParenthesis
        ? `({${mergedContent}})`
        : `{${mergedContent}}`,
      ...mergeFragmentImportsAndHoistedFragments(fragments),
    };
  },

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
};
