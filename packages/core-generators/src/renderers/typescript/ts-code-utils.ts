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
};
