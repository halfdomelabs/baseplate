// have to deal with circular dependencies
/* eslint-disable @typescript-eslint/no-use-before-define */

/* eslint-disable max-classes-per-file */
// specifies a block of code

import R from 'ramda';
import { ImportMapper } from '../../providers';
import { notEmpty } from '../../utils/array';
import { ImportDeclarationEntry } from './imports';

export interface TypescriptCodeEntryOptions {
  imports?: ImportDeclarationEntry[];
  importText?: string[];
  headerBlocks?: TypescriptCodeBlock[];
  importMappers?: ImportMapper[];
}

export abstract class TypescriptCodeEntry {
  type: string;

  options: TypescriptCodeEntryOptions;

  constructor(
    type: string,
    importText?: string | string[] | null,
    options?: TypescriptCodeEntryOptions
  ) {
    if (
      options?.headerBlocks?.some(
        (block) => block?.options.headerBlocks?.length
      )
    ) {
      throw new Error('Header blocks cannot contain header blocks');
    }

    this.type = type;
    this.options = {
      ...options,
      importText: [options?.importText, importText].filter(notEmpty).flat(),
    };
  }
}

export function mergeCodeEntryOptions(
  entriesOrOptions: (
    | TypescriptCodeEntry
    | undefined
    | TypescriptCodeEntryOptions
  )[]
): TypescriptCodeEntryOptions {
  const options = entriesOrOptions
    .filter(notEmpty)
    .map((e) => (e instanceof TypescriptCodeEntry ? e.options : e));
  return {
    imports: R.flatten(options.map((e) => e.imports).filter(notEmpty)),
    importText: R.flatten(options.map((e) => e.importText).filter(notEmpty)),
    headerBlocks: R.flatten(
      options.map((e) => e.headerBlocks).filter(notEmpty)
    ),
    importMappers: R.flatten(
      R.uniq(options.map((e) => e.importMappers).filter(notEmpty))
    ),
  };
}

export abstract class TypescriptCodeContents extends TypescriptCodeEntry {
  content: string;

  constructor(
    type: string,
    content: string,
    importText?: string | string[] | null,
    options?: TypescriptCodeEntryOptions
  ) {
    super(type, importText, options);
    this.content = content;
  }
}

export class TypescriptCodeBlock extends TypescriptCodeContents {
  type: 'code-block' = 'code-block';

  constructor(
    content: string,
    importText?: string | string[] | null,
    options?: TypescriptCodeEntryOptions
  ) {
    super('code-block', content, importText, options);
  }

  wrapAsExpression(
    wrapper: (contents: string) => string
  ): TypescriptCodeExpression {
    return new TypescriptCodeExpression(
      wrapper(this.content),
      null,
      this.options
    );
  }
}

export class TypescriptCodeExpression extends TypescriptCodeContents {
  type: 'code-expression' = 'code-expression';

  constructor(
    content: string,
    importText?: string | string[] | null,
    options?: TypescriptCodeEntryOptions
  ) {
    super('code-expression', content, importText, options);
  }

  toBlock(): TypescriptCodeBlock {
    return new TypescriptCodeBlock(this.content, null, this.options);
  }

  wrap(wrapper: (contents: string) => string): TypescriptCodeExpression {
    return new TypescriptCodeExpression(
      wrapper(this.content),
      null,
      this.options
    );
  }

  append(text: string): TypescriptCodeExpression {
    return new TypescriptCodeExpression(
      `${this.content}${text}`,
      null,
      this.options
    );
  }
}

export type TypescriptCodeWrapperFunction = (contents: string) => string;

export class TypescriptCodeWrapper extends TypescriptCodeEntry {
  type: 'code-wrapper' = 'code-wrapper';

  wrap: TypescriptCodeWrapperFunction;

  constructor(
    wrapper: TypescriptCodeWrapperFunction,
    importText?: string | string[] | null,
    options?: TypescriptCodeEntryOptions
  ) {
    super('code-wrapper', importText, options);
    this.wrap = wrapper;
  }
}

function mergeBlocks(
  entries: TypescriptCodeBlock[],
  separator = '\n'
): TypescriptCodeBlock {
  return new TypescriptCodeBlock(
    entries.map((e) => e.content).join(separator),
    null,
    mergeCodeEntryOptions(entries)
  );
}

/**
 * Should only be used with JSX
 */
function mergeExpressions(
  entries: TypescriptCodeExpression[],
  separator = '\n'
): TypescriptCodeExpression {
  return new TypescriptCodeExpression(
    entries.map((e) => e.content).join(separator),
    null,
    mergeCodeEntryOptions(entries)
  );
}

function mergeWrappers(
  entries: TypescriptCodeWrapper[]
): TypescriptCodeWrapper {
  return new TypescriptCodeWrapper(
    (contents) =>
      entries.reverse().reduce((prev, cur) => cur.wrap(prev), contents),
    null,
    mergeCodeEntryOptions(entries)
  );
}

function normalizeWrappers(
  wrappers:
    | TypescriptCodeWrapper
    | TypescriptCodeWrapper[]
    | TypescriptCodeWrapperFunction
): TypescriptCodeWrapper {
  if (Array.isArray(wrappers)) {
    return mergeWrappers(wrappers);
  }
  if (typeof wrappers === 'function') {
    return new TypescriptCodeWrapper(wrappers);
  }
  return wrappers;
}

function formatStringWithContent(
  str: string,
  args: Record<string, TypescriptCodeContents | string>
): string {
  if (Object.keys(args).some((key) => !/^[A-Za-z_-]+$/.test(key))) {
    throw new Error('All arguments for format must follow [A-Z_-]');
  }
  const regex = new RegExp(`(${Object.keys(args).join('|')})`, 'g');
  return str.replace(regex, (key) => {
    const entry = args[key];
    if (!entry) {
      throw new Error(`Could not find entry for ${key}`);
    }
    return typeof entry === 'string' ? entry : entry.content;
  });
}

function isTypescriptCodeEntry(value: unknown): value is TypescriptCodeEntry {
  return value instanceof TypescriptCodeEntry;
}

export const TypescriptCodeUtils = {
  createBlock(
    code: string,
    importText: string | string[] = [],
    options?: TypescriptCodeEntryOptions
  ): TypescriptCodeBlock {
    return new TypescriptCodeBlock(
      code,
      Array.isArray(importText) ? importText : [importText],
      options
    );
  },
  createExpression(
    expression: string,
    importText: string | string[] = [],
    options?: TypescriptCodeEntryOptions
  ): TypescriptCodeExpression {
    return new TypescriptCodeExpression(
      expression,
      Array.isArray(importText) ? importText : [importText],
      options
    );
  },
  createWrapper(
    wrap: TypescriptCodeWrapperFunction,
    importText: string | string[] = [],
    options?: TypescriptCodeEntryOptions
  ): TypescriptCodeWrapper {
    return new TypescriptCodeWrapper(
      wrap,
      Array.isArray(importText) ? importText : [importText],
      options
    );
  },
  mergeBlocks,
  mergeExpressions,
  mergeWrappers,
  wrapExpression(
    entry: TypescriptCodeExpression,
    wrappers:
      | TypescriptCodeWrapper
      | TypescriptCodeWrapper[]
      | TypescriptCodeWrapperFunction
  ): TypescriptCodeExpression {
    const wrapper = normalizeWrappers(wrappers);
    return new TypescriptCodeExpression(
      wrapper.wrap(entry.content),
      null,
      mergeCodeEntryOptions([entry, wrapper])
    );
  },
  wrapBlock(
    entry: TypescriptCodeBlock,
    wrappers:
      | TypescriptCodeWrapper
      | TypescriptCodeWrapper[]
      | TypescriptCodeWrapperFunction
  ): TypescriptCodeBlock {
    const wrapper = normalizeWrappers(wrappers);
    return new TypescriptCodeBlock(
      wrapper.wrap(entry.content),
      null,
      mergeCodeEntryOptions([entry, wrapper])
    );
  },
  toBlock(entry: TypescriptCodeExpression): TypescriptCodeBlock {
    return entry.toBlock();
  },
  mergeExpressionsAsArray(
    entries: TypescriptCodeExpression[]
  ): TypescriptCodeExpression {
    const mergedExpression = mergeExpressions(entries, ', ');
    return new TypescriptCodeExpression(
      `[${mergedExpression.content}]`,
      null,
      mergedExpression.options
    );
  },
  mergeExpressionsAsObject(
    obj: Record<string, TypescriptCodeExpression>,
    options: {
      wrapWithParenthesis?: boolean;
    } = {}
  ): TypescriptCodeExpression {
    const { wrapWithParenthesis = false } = options;
    const keys = Object.keys(obj);
    const expressions = Object.values(obj);
    const mergedExpression = keys
      .map((key) => {
        if (key === obj[key].content) {
          return `${key},`;
        }
        return `${key}: ${obj[key].content},`;
      })
      .join('\n');
    return new TypescriptCodeExpression(
      wrapWithParenthesis
        ? `({\n${mergedExpression}\n})`
        : `{\n${mergedExpression}\n}`,
      null,
      mergeCodeEntryOptions(expressions)
    );
  },
  mergeBlocksAsInterfaceContent(
    obj: Record<string, TypescriptCodeExpression>
  ): TypescriptCodeBlock {
    const keys = Object.keys(obj);
    const expressions = Object.values(obj);
    const mergedBlock = keys
      .map((key) => `${key}: ${obj[key].content};`)
      .join('\n');
    return new TypescriptCodeBlock(
      mergedBlock,
      null,
      mergeCodeEntryOptions(expressions)
    );
  },
  formatAsComment(text: string): string {
    return text
      .split('\n')
      .map((line) => `// ${line}`)
      .join('\n');
  },
  appendToExpression(
    expression: TypescriptCodeExpression,
    text: string
  ): TypescriptCodeExpression {
    return expression.append(text);
  },
  formatBlock(
    formatString: string,
    args: Record<string, TypescriptCodeContents | string>,
    options?: TypescriptCodeEntryOptions
  ): TypescriptCodeBlock {
    return new TypescriptCodeBlock(
      formatStringWithContent(formatString, args),
      null,
      mergeCodeEntryOptions([
        ...(Object.values(args).filter(
          isTypescriptCodeEntry
        ) as TypescriptCodeEntry[]),
        options,
      ])
    );
  },
  formatExpression(
    formatString: string,
    args: Record<string, TypescriptCodeContents | string>,
    options?: TypescriptCodeEntryOptions
  ): TypescriptCodeExpression {
    return new TypescriptCodeExpression(
      formatStringWithContent(formatString, args),
      null,
      mergeCodeEntryOptions([
        ...(Object.values(args).filter(
          isTypescriptCodeEntry
        ) as TypescriptCodeEntry[]),
        options,
      ])
    );
  },
};
