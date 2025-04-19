import type { TsCodeFragment } from '../fragments/types.js';
import type { TsImportDeclaration } from '../imports/types.js';

export interface TsImportMapSchemaEntry<
  IsTypeOnly extends boolean | undefined = boolean | undefined,
> {
  /**
   * The name of the import (if not the key of the entry).
   */
  name?: string;
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
  source: string;
  isTypeOnly: IsTypeOnly;
  declaration(
    alias?: string,
  ): IsTypeOnly extends true ? never : TsImportDeclaration;
  typeDeclaration(alias?: string): TsImportDeclaration;
  fragment(): TsCodeFragment;
  typeFragment(): TsCodeFragment;
}

export type TsImportMap = Record<string, TsImportMapEntry>;

export type InferTsImportMapFromSchema<T extends TsImportMapSchema> = {
  [K in keyof T]: TsImportMapEntry<T[K]['isTypeOnly']>;
};

export type TsImportMapProviderFromSchema<T extends TsImportMapSchema> =
  InferTsImportMapFromSchema<T>;
