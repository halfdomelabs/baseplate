import type { TsCodeFragment } from '../fragments/types.js';
import type { TsImportDeclaration } from '../imports/types.js';

export interface TsImportMapSchemaEntry<
  IsTypeOnly extends boolean | undefined = boolean | undefined,
> {
  /**
   * The name this symbol is exported as from the module. Use `default` for default exports.
   *
   * Defaults to the key of the entry.
   */
  exportedAs?: string;
  /**
   * If the import can only be type only.
   */
  isTypeOnly?: IsTypeOnly;
}

export type TsImportMapSchema = Record<string, TsImportMapSchemaEntry>;

export interface TsImportMapEntry<
  IsTypeOnly extends boolean | undefined = boolean | undefined,
> {
  name: string;
  moduleSpecifier: string;
  isTypeOnly: IsTypeOnly;
  declaration: IsTypeOnly extends true
    ? never
    : (alias?: string) => TsImportDeclaration;
  typeDeclaration: (alias?: string) => TsImportDeclaration;
  fragment: IsTypeOnly extends true ? never : () => TsCodeFragment;
  typeFragment: () => TsCodeFragment;
}

export type TsImportMap = Record<string, TsImportMapEntry>;

export type InferTsImportMapFromSchema<T extends TsImportMapSchema> = {
  [K in keyof T]: TsImportMapEntry<T[K]['isTypeOnly']>;
};

export type TsImportMapProviderFromSchema<T extends TsImportMapSchema> =
  InferTsImportMapFromSchema<T>;
