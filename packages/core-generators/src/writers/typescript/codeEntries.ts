// specifies a block of code

import { ImportDeclarationEntry } from './imports';

export interface TypescriptCodeEntry {
  imports?: ImportDeclarationEntry[];
}

export interface TypescriptCodeBlock extends TypescriptCodeEntry {
  code: string;
}

export type TypescriptCodeWrapperRenderer = (contents: string) => string;

export interface TypescriptCodeWrapper extends TypescriptCodeEntry {
  render: TypescriptCodeWrapperRenderer;
}

export function mergeTypescriptCodeBlocks(
  entries: TypescriptCodeBlock[]
): string {
  return entries.map((e) => e.code).join('\n\n');
}

export function mergeTypescriptCodeWrappers(
  entries: TypescriptCodeWrapper[]
): TypescriptCodeWrapperRenderer {
  return (contents: string) =>
    entries.reverse().reduce((prev, cur) => cur.render(prev), contents);
}
