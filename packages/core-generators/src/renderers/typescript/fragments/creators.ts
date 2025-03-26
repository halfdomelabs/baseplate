import type { TsImportDeclaration } from '../imports/types.js';
import type {
  TsCodeFragment,
  TsHoistedFragment,
  TsHoistedFragmentPosition,
} from './types.js';

export function tsHoistedFragment(
  fragment: TsCodeFragment,
  key: string,
  position?: TsHoistedFragmentPosition,
): TsHoistedFragment {
  return { key, position, fragment };
}

export function tsCodeFragment(
  contents: string,
  imports?: TsImportDeclaration[] | TsImportDeclaration,
  {
    hoistedFragments,
  }: {
    hoistedFragments?: TsHoistedFragment[];
  } = {},
): TsCodeFragment {
  return {
    contents,
    imports: Array.isArray(imports) ? imports : imports ? [imports] : [],
    hoistedFragments,
  };
}
