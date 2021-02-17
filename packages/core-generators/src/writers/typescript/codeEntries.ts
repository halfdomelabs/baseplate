// specifies a block of code

import R from 'ramda';
import { notEmpty } from '../../utils/array';
import { ImportDeclarationEntry } from './imports';

export interface TypescriptCodeEntry {
  imports?: ImportDeclarationEntry[];
  importText?: string[];
}

export interface TypescriptCodeBlock extends TypescriptCodeEntry {
  code: string;
}

export interface TypescriptCodeExpression extends TypescriptCodeEntry {
  expression: string;
}

export type TypescriptCodeWrapperFunction = (contents: string) => string;

export interface TypescriptCodeWrapper extends TypescriptCodeEntry {
  wrap: TypescriptCodeWrapperFunction;
}

function mergeCodeEntries(entries: TypescriptCodeEntry[]): TypescriptCodeEntry {
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
    code: entries.map((e) => e.code).join(separator),
    ...mergeCodeEntries(entries),
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
    expression: entries.map((e) => e.expression).join(separator),
    ...mergeCodeEntries(entries),
  };
}

function mergeWrappers(
  entries: TypescriptCodeWrapper[]
): TypescriptCodeWrapper {
  return {
    wrap: (contents) =>
      entries.reverse().reduce((prev, cur) => cur.wrap(prev), contents),
    ...mergeCodeEntries(entries),
  };
}

export const TypescriptCodeUtils = {
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
      expression: wrapper.wrap(entry.expression),
      ...mergeCodeEntries([wrapper, entry]),
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
      code: wrapper.wrap(entry.code),
      ...mergeCodeEntries([wrapper, entry]),
    };
  },
  toBlock(entry: TypescriptCodeExpression): TypescriptCodeBlock {
    return {
      code: entry.expression,
      imports: entry.imports,
      importText: entry.importText,
    };
  },
  mergeExpressionsAsObject(
    obj: Record<string, TypescriptCodeExpression>
  ): TypescriptCodeExpression {
    const keys = Object.keys(obj);
    const expressions = Object.values(obj);
    const mergedExpression = keys
      .map((key) => `${key}: ${obj[key].expression},`)
      .join('\n');
    return {
      expression: `{\n${mergedExpression}\n}`,
      ...mergeCodeEntries(expressions),
    };
  },
};
