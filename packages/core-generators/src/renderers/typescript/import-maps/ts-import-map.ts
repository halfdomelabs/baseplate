import type { TsImportDeclaration } from '../imports/types.js';
import type {
  InferTsImportMapFromSchema,
  TsImportMapSchema,
  TsImportMapSchemaEntry,
} from './types.js';

import { tsCodeFragment } from '../fragments/creators.js';

export function createTsImportMapSchema<
  T extends Record<string, TsImportMapSchemaEntry>,
>(importSchema: T): T {
  return importSchema;
}

type ImportMapInputFromSchema<T extends TsImportMapSchema> = {
  [K in keyof T]:
    | string
    | {
        source: string;
      };
};

export function createTsImportMap<
  T extends Record<string, TsImportMapSchemaEntry>,
>(
  importSchema: T,
  imports: ImportMapInputFromSchema<T>,
): InferTsImportMapFromSchema<T> {
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
        ...(name === 'default'
          ? { defaultImport: alias ?? key }
          : {
              namedImports: [{ name, alias }],
            }),
        isTypeOnly,
      });

      return [
        key,
        {
          name,
          source,
          isTypeOnly: value.isTypeOnly,
          declaration: (alias) => {
            if (value.isTypeOnly) {
              throw new Error(
                'Type only imports cannot be marked as named imports',
              );
            }
            return makeDeclaration(alias);
          },
          typeDeclaration: (alias) => makeDeclaration(alias, true),
          frag: () => tsCodeFragment(name, makeDeclaration()),
          typeFrag: () =>
            tsCodeFragment(name, makeDeclaration(undefined, true)),
        },
      ];
    }),
  ) as InferTsImportMapFromSchema<T>;
}
