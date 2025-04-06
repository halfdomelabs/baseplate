import {
  createOutputProviderType,
  type ProviderType,
} from '@halfdomelabs/sync';

import type { TsImportDeclaration } from './types.js';

export interface ImportMapSchemaEntry<IsTypeOnly extends boolean = boolean> {
  /**
   * The name of the import (if not the key of the entry).
   */
  name?: string;
  /**
   * If the import can only be type only.
   */
  isTypeOnly?: IsTypeOnly;
}

export function createImportMapSchema<
  T extends Record<string, ImportMapSchemaEntry>,
>(importSchema: T): T {
  return importSchema;
}

export interface ImportMapEntry<
  IsTypeOnly extends boolean | undefined = boolean,
> {
  name: string;
  source: string;
  declaration(
    alias?: string,
  ): IsTypeOnly extends true ? never : TsImportDeclaration;
  typeDeclaration(alias?: string): TsImportDeclaration;
}

type InferImportMapFromSchema<T extends Record<string, ImportMapSchemaEntry>> =
  {
    [K in keyof T]: ImportMapEntry<T[K]['isTypeOnly']>;
  };

export function createImportMap<T extends Record<string, ImportMapSchemaEntry>>(
  importSchema: T,
  imports: {
    [K in keyof T]:
      | string
      | {
          source: string;
        };
  },
): InferImportMapFromSchema<T> {
  return Object.fromEntries(
    Object.entries(importSchema).map(([key, value]) => {
      const name = value.name ?? key;
      const source =
        typeof imports[key] === 'string' ? imports[key] : imports[key].source;

      const makeDeclaration = (
        alias?: string,
        isTypeOnly?: boolean,
      ): TsImportDeclaration => ({
        source,
        ...(alias ? { namedImports: [{ name, alias }] } : {}),
        isTypeOnly,
      });

      return [
        key,
        {
          name,
          source,
          declaration: (alias) => {
            if (value.isTypeOnly) {
              throw new Error(
                'Type only imports cannot be marked as named imports',
              );
            }
            return makeDeclaration(alias);
          },
          typeDeclaration: (alias) => makeDeclaration(alias, true),
        },
      ];
    }),
  ) as InferImportMapFromSchema<T>;
}

export function createImportMapProvider<
  T extends Record<string, ImportMapSchemaEntry>,
>(
  name: string,
  importSchema: T,
): [T, ProviderType<InferImportMapFromSchema<T>>] {
  return [importSchema, createOutputProviderType(name)];
}
