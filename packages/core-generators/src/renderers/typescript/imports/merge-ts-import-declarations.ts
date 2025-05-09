import { mapGroupBy } from '@halfdomelabs/utils';
import { uniqBy } from 'es-toolkit';

import type { TsImportDeclaration } from './types.js';

/**
 * Error thrown when conflicting import declarations cannot be resolved.
 */
export class ImportConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportConflictError';
  }
}

const DEFAULT_SYMBOL = Symbol('default');
const NAMESPACE_SYMBOL = Symbol('namespace');

interface NamedImportEntry {
  moduleSpecifier: string;
  name: string | typeof DEFAULT_SYMBOL | typeof NAMESPACE_SYMBOL;
  alias: string;
  isTypeOnly: boolean;
}

function convertToNamedImportEntries(
  imports: TsImportDeclaration[],
): NamedImportEntry[] {
  return imports.flatMap((i) =>
    [
      i.defaultImport === undefined
        ? undefined
        : ({
            moduleSpecifier: i.moduleSpecifier,
            name: DEFAULT_SYMBOL,
            alias: i.defaultImport,
            isTypeOnly: i.isTypeOnly ?? false,
          } as NamedImportEntry),
      i.namespaceImport === undefined
        ? undefined
        : ({
            moduleSpecifier: i.moduleSpecifier,
            name: NAMESPACE_SYMBOL,
            alias: i.namespaceImport,
            isTypeOnly: i.isTypeOnly ?? false,
          } as NamedImportEntry),
      ...(i.namedImports ?? []).map((namedImport) => ({
        moduleSpecifier: i.moduleSpecifier,
        name: namedImport.name,
        alias: namedImport.alias ?? namedImport.name,
        isTypeOnly: i.isTypeOnly ? true : (namedImport.isTypeOnly ?? false),
      })),
    ].filter((x) => x !== undefined),
  );
}

function assertNoConflictingImportEntries(entries: NamedImportEntry[]): void {
  const groupedByName = mapGroupBy(entries, (e) => e.name);

  for (const [name, entries] of groupedByName.entries()) {
    const nameSet = new Set(entries.map((e) => e.alias));

    if (nameSet.size !== 1) {
      throw new ImportConflictError(
        `Conflicting aliases for named import "${name.toString()}" from "${entries[0].moduleSpecifier}" (${entries.map((e) => e.alias).join(', ')})`,
      );
    }
  }
}

function convertToImportDeclarations(
  moduleSpecifier: string,
  isTypeOnly: boolean,
  entries: NamedImportEntry[],
): TsImportDeclaration[] {
  const defaultEntry = entries.find((e) => e.name === DEFAULT_SYMBOL);
  const namespaceEntry = entries.find((e) => e.name === NAMESPACE_SYMBOL);
  const namedImportEntries = entries
    .filter((e) => typeof e.name === 'string')
    .map((e) => ({
      name: e.name as string,
      alias: e.alias === e.name ? undefined : e.alias,
    }))
    .toSorted((a, b) => (a.alias ?? a.name).localeCompare(b.alias ?? b.name));

  const importDeclarations: TsImportDeclaration[] = [];
  const addDeclaration = (declaration: Partial<TsImportDeclaration>): void => {
    importDeclarations.push({
      moduleSpecifier,
      isTypeOnly: isTypeOnly ? true : undefined,
      ...declaration,
    });
  };

  if (namespaceEntry) {
    addDeclaration({ namespaceImport: namespaceEntry.alias });
  }

  // Type-only imports must split out default and named imports
  if (isTypeOnly) {
    if (defaultEntry) {
      addDeclaration({ defaultImport: defaultEntry.alias });
    }

    if (namedImportEntries.length > 0) {
      addDeclaration({ namedImports: namedImportEntries });
    }
  } else if (defaultEntry || namedImportEntries.length > 0) {
    addDeclaration({
      defaultImport: defaultEntry?.alias,
      namedImports:
        namedImportEntries.length > 0 ? namedImportEntries : undefined,
    });
  }

  return importDeclarations;
}

/**
 * Merges multiple TypeScript import declarations to create optimized imports.
 *
 * This function resolves conflicts and merges imports with the same moduleSpecifier,
 * handling both regular and type-only imports appropriately. It also supports
 * individual named imports marked as type-only.
 *
 * @param declarations - Array of import declarations to merge
 * @returns Merged array of import declarations
 * @throws {ImportConflictError} When conflicting imports are detected
 */
export function mergeTsImportDeclarations(
  declarations: TsImportDeclaration[],
): TsImportDeclaration[] {
  const namedImportEntries = convertToNamedImportEntries(declarations);
  const importGroups = mapGroupBy(namedImportEntries, (e) => e.moduleSpecifier);

  const result: TsImportDeclaration[] = [];

  // Process each module specifier's imports
  for (const [moduleSpecifier, entries] of importGroups.entries()) {
    // Remove type-only imports that conflict with regular imports
    assertNoConflictingImportEntries(entries);
    const regularEntries = entries.filter((e) => !e.isTypeOnly);
    const typeOnlyEntries = entries.filter(
      (e) => e.isTypeOnly && !regularEntries.some((re) => re.name === e.name),
    );

    const uniqueRegularEntries = uniqBy(regularEntries, (e) => e.name);
    const uniqueTypeOnlyEntries = uniqBy(typeOnlyEntries, (e) => e.name);

    result.push(
      ...convertToImportDeclarations(
        moduleSpecifier,
        false,
        uniqueRegularEntries,
      ),
      ...convertToImportDeclarations(
        moduleSpecifier,
        true,
        uniqueTypeOnlyEntries,
      ),
    );
  }

  return result;
}
