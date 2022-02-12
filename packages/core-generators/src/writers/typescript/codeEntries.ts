// specifies a block of code

import R from 'ramda';
import { notEmpty } from '../../utils/array';
import { ImportDeclarationEntry } from './imports';

export interface TypescriptCodeEntry {
  type: string;
  imports?: ImportDeclarationEntry[];
  importText?: string[];
}

export interface TypescriptCodeBlock extends TypescriptCodeEntry {
  type: 'code-block';
  code: string;
}

export interface TypescriptCodeExpression extends TypescriptCodeEntry {
  type: 'code-expression';
  expression: string;
}

export type TypescriptCodeWrapperFunction = (contents: string) => string;

export interface TypescriptCodeWrapper extends TypescriptCodeEntry {
  type: 'code-wrapper';
  wrap: TypescriptCodeWrapperFunction;
}

type CodeEntryImports = Pick<TypescriptCodeEntry, 'imports' | 'importText'>;

export function mergeCodeImports(
  entries: CodeEntryImports[]
): CodeEntryImports {
  return {
    imports: R.flatten(entries.map((e) => e.imports).filter(notEmpty)),
    importText: R.flatten(entries.map((e) => e.importText).filter(notEmpty)),
  };
}

function mergeBlocks(
  entries: TypescriptCodeBlock[],
  separator = '\n'
): TypescriptCodeBlock {
  return {
    type: 'code-block',
    code: entries.map((e) => e.code).join(separator),
    ...mergeCodeImports(entries),
  };
}

/**
 * Should only be used with JSX
 */
function mergeExpressions(
  entries: TypescriptCodeExpression[],
  separator = '\n'
): TypescriptCodeExpression {
  return {
    type: 'code-expression',
    expression: entries.map((e) => e.expression).join(separator),
    ...mergeCodeImports(entries),
  };
}

function mergeWrappers(
  entries: TypescriptCodeWrapper[]
): TypescriptCodeWrapper {
  return {
    type: 'code-wrapper',
    wrap: (contents) =>
      entries.reverse().reduce((prev, cur) => cur.wrap(prev), contents),
    ...mergeCodeImports(entries),
  };
}

export const TypescriptCodeUtils = {
  createBlock(
    code: string,
    importText: string | string[] = []
  ): TypescriptCodeBlock {
    return {
      type: 'code-block',
      code,
      importText: Array.isArray(importText) ? importText : [importText],
    };
  },
  createExpression(
    expression: string,
    importText: string | string[] = []
  ): TypescriptCodeExpression {
    return {
      type: 'code-expression',
      expression,
      importText: Array.isArray(importText) ? importText : [importText],
    };
  },
  createWrapper(
    wrap: TypescriptCodeWrapperFunction,
    importText: string | string[] = []
  ): TypescriptCodeWrapper {
    return {
      type: 'code-wrapper',
      wrap,
      importText: Array.isArray(importText) ? importText : [importText],
    };
  },
  mergeBlocks,
  mergeExpressions,
  mergeWrappers,
  wrapExpression(
    entry: TypescriptCodeExpression,
    wrappers: TypescriptCodeWrapper | TypescriptCodeWrapper[]
  ): TypescriptCodeExpression {
    const wrapper = Array.isArray(wrappers)
      ? mergeWrappers(wrappers)
      : wrappers;
    return {
      type: 'code-expression',
      expression: wrapper.wrap(entry.expression),
      ...mergeCodeImports([wrapper, entry]),
    };
  },
  wrapBlock(
    entry: TypescriptCodeBlock,
    wrappers: TypescriptCodeWrapper | TypescriptCodeWrapper[]
  ): TypescriptCodeBlock {
    const wrapper = Array.isArray(wrappers)
      ? mergeWrappers(wrappers)
      : wrappers;
    return {
      type: 'code-block',
      code: wrapper.wrap(entry.code),
      ...mergeCodeImports([wrapper, entry]),
    };
  },
  toBlock(entry: TypescriptCodeExpression): TypescriptCodeBlock {
    return {
      type: 'code-block',
      code: entry.expression,
      imports: entry.imports,
      importText: entry.importText,
    };
  },
  mergeExpressionsAsArray(
    entries: TypescriptCodeExpression[]
  ): TypescriptCodeExpression {
    const mergedExpression = mergeExpressions(entries, ', ');
    return {
      ...mergedExpression,
      expression: `[${mergedExpression.expression}]`,
    };
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
      .map((key) => `${key}: ${obj[key].expression},`)
      .join('\n');
    return {
      type: 'code-expression',
      expression: wrapWithParenthesis
        ? `({\n${mergedExpression}\n})`
        : `{\n${mergedExpression}\n}`,
      ...mergeCodeImports(expressions),
    };
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
    return {
      ...expression,
      expression: `${expression.expression}${text}`,
    };
  },
};
