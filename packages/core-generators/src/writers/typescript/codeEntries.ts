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

export type TypescriptCodeWrapperRenderer = (contents: string) => string;

export interface TypescriptCodeWrapper extends TypescriptCodeEntry {
  render: TypescriptCodeWrapperRenderer;
}

export function mergeTypescriptCodeBlocks(
  entries: TypescriptCodeBlock[],
  join = '\n'
): TypescriptCodeBlock {
  return {
    code: entries.map((e) => e.code).join(join),
    imports: R.flatten(entries.map((e) => e.imports).filter(notEmpty)),
    importText: R.flatten(entries.map((e) => e.importText).filter(notEmpty)),
  };
}

export function wrapTypescriptCodeBlock(
  wrapper: TypescriptCodeWrapper,
  entry: TypescriptCodeBlock
): TypescriptCodeBlock {
  const entries = [wrapper, entry];
  return {
    code: wrapper.render(entry.code),
    imports: R.flatten(entries.map((e) => e.imports).filter(notEmpty)),
    importText: R.flatten(entries.map((e) => e.importText).filter(notEmpty)),
  };
}

export function renderTypescriptCodeBlocks(
  entries: TypescriptCodeBlock[]
): string {
  return entries.map((e) => e.code).join('\n\n');
}

export function renderTypescriptCodeWrappers(
  entries: TypescriptCodeWrapper[]
): TypescriptCodeWrapperRenderer {
  return (contents: string) =>
    entries.reverse().reduce((prev, cur) => cur.render(prev), contents);
}
