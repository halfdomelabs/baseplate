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
        moduleSpecifier: string;
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
      const moduleSpecifier =
        typeof imports[key] === 'string'
          ? imports[key]
          : imports[key].moduleSpecifier;

      const makeDeclaration = (
        alias?: string,
        isTypeOnly?: boolean,
      ): TsImportDeclaration => {
        if (value.isTypeOnly && !isTypeOnly) {
          throw new Error(
            `Import ${name} in ${moduleSpecifier} must be marked with type-only imports`,
          );
        }
        return {
          moduleSpecifier,
          ...(name === 'default'
            ? { defaultImport: alias ?? key }
            : {
                namedImports: [{ name, alias }],
              }),
          isTypeOnly,
        };
      };

      return [
        key,
        {
          name,
          moduleSpecifier,
          isTypeOnly: value.isTypeOnly,
          declaration: (alias) => makeDeclaration(alias),
          typeDeclaration: (alias) => makeDeclaration(alias, true),
          fragment: () => tsCodeFragment(name, makeDeclaration()),
          typeFragment: () =>
            tsCodeFragment(name, makeDeclaration(undefined, true)),
        },
      ];
    }),
  ) as InferTsImportMapFromSchema<T>;
}
