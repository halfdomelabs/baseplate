import type { TsImportDeclaration } from '../imports/types.js';
import type {
  TsCodeFragment,
  TsHoistedFragment,
  TsHoistedFragmentPosition,
  TsPositionedHoistedFragment,
} from './types.js';

export interface TsCodeFragmentOptions {
  hoistedFragments?: TsHoistedFragment[];
}

/**
 * Create a hoisted fragment.
 * @param key - The key to use for the hoisted fragment.
 * @param fragment - The fragment to hoist.
 * @returns The hoisted fragment.
 */
export function tsHoistedFragment(
  key: string,
  fragment: TsCodeFragment | string,
  imports?: TsImportDeclaration[] | TsImportDeclaration,
  { hoistedFragments }: TsCodeFragmentOptions = {},
): TsHoistedFragment {
  const importArr = Array.isArray(imports) ? imports : imports ? [imports] : [];
  const fragmentObj =
    typeof fragment === 'string' ? tsCodeFragment(fragment) : fragment;
  return {
    key,
    contents: fragmentObj.contents,
    imports: [...importArr, ...(fragmentObj.imports ?? [])],
    hoistedFragments: [
      ...(hoistedFragments ?? []),
      ...(fragmentObj.hoistedFragments ?? []),
    ],
  };
}

/**
 * Create a positioned hoisted fragment.
 * @param key - The key to use for the positioned hoisted fragment.
 * @param fragment - The fragment to hoist.
 * @param position - The position to insert the positioned hoisted fragment.
 * @returns The positioned hoisted fragment.
 */
export function tsPositionedHoistedFragment(
  key: string,
  fragment: TsCodeFragment | string,
  position: TsHoistedFragmentPosition,
): TsPositionedHoistedFragment {
  return { ...tsHoistedFragment(key, fragment), position };
}

/**
 * Create a code fragment.
 * @param contents - The contents of the code fragment.
 * @param imports - The imports to add to the code fragment.
 * @param options - The options for the code fragment.
 * @returns The code fragment.
 */
export function tsCodeFragment(
  contents: string,
  imports?: TsImportDeclaration[] | TsImportDeclaration,
  { hoistedFragments }: TsCodeFragmentOptions = {},
): TsCodeFragment {
  return {
    contents,
    imports: Array.isArray(imports) ? imports : imports ? [imports] : [],
    hoistedFragments,
  };
}
