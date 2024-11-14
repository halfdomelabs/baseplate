import type { CodeBlockWriter, SourceFile, ts } from 'ts-morph';

import { groupBy, mapValues } from 'es-toolkit';
import path from 'node:path';
import * as R from 'ramda';

import { notEmpty } from '@src/utils/array.js';

import type { ImportMap, ImportMapper } from '../../providers/index.js';

import { sortByImportOrder } from './import-order.js';

export interface NamedImportEntry {
  name: string;
  alias?: string;
}

export interface ImportDeclarationEntry {
  isTypeOnly?: boolean;
  defaultImport?: string;
  namespaceImport?: string;
  namedImports?: NamedImportEntry[];
  moduleSpecifier: string;
}

interface ImportEntry {
  name: string;
  alias?: string;
  isTypeOnly?: boolean;
  moduleSpecifier: string;
}

// Map for paths support
// so { "baseUrl": "./src", "paths": { "@src/*": ["./*"] } }
// would be { from: "src", to: "@src" }
export interface PathMapEntry {
  from: string; // e.g. src/app
  to: string; // e.g. app
}

export type ModuleResolutionKind = `${ts.server.protocol.ModuleResolutionKind}`;

export interface ResolveModuleOptions {
  importMappers?: ImportMapper[];
  pathMapEntries?: PathMapEntry[];
  moduleResolution: ModuleResolutionKind;
}

/**
 * Shortens the path for resolution method namely for CJS, it will remove the .js extension
 */
function shortenPathForResolutionMethod(
  path: string,
  moduleResolution: ModuleResolutionKind,
): string {
  const isNode16 =
    moduleResolution === 'node16' || moduleResolution === 'nodenext';
  if (
    isNode16 &&
    (path.startsWith('.') || path.startsWith('@src/')) &&
    !path.endsWith('.js')
  ) {
    throw new Error(
      `Invalid Node 16 import discovered ${path}. Make sure to use .js extension for Node16 imports.`,
    );
  }

  return isNode16 ? path : path.replace(/(\/index)?\.js$/, '');
}

export function resolveModule(
  moduleSpecifier: string,
  directory: string,
  { pathMapEntries, moduleResolution }: ResolveModuleOptions,
): string {
  // if not relative import, just return directly
  if (!moduleSpecifier.startsWith('@/')) {
    return shortenPathForResolutionMethod(moduleSpecifier, moduleResolution);
  }
  // figure out relative directory
  const absolutePath = moduleSpecifier.slice(2);
  const relativePathImport = (() => {
    const relativePath = path.relative(directory, absolutePath);

    return relativePath.startsWith('./') ||
      relativePath.startsWith('../') ||
      ['.', '..'].includes(relativePath)
      ? relativePath
      : `./${relativePath}`;
  })();

  const typescriptPathImport = (() => {
    const pathEntry = pathMapEntries?.find((map) =>
      absolutePath.startsWith(map.from),
    );
    if (!pathEntry) {
      return null;
    }
    return pathEntry.to + absolutePath.slice(pathEntry.from.length);
  })();

  return shortenPathForResolutionMethod(
    typescriptPathImport &&
      typescriptPathImport.length < relativePathImport.length
      ? typescriptPathImport
      : relativePathImport,
    moduleResolution,
  );
}

function resolveImportDeclaration(
  declaration: ImportDeclarationEntry,
  directory: string,
  options: ResolveModuleOptions,
): ImportDeclarationEntry {
  return {
    ...declaration,
    moduleSpecifier: resolveModule(
      declaration.moduleSpecifier,
      directory,
      options,
    ),
  };
}

function importDeclarationToImportEntries(
  declaration: ImportDeclarationEntry,
): ImportEntry[] {
  const importEntries: ImportEntry[] = [];
  const entryDefaults = {
    isTypeOnly: declaration.isTypeOnly,
    moduleSpecifier: declaration.moduleSpecifier,
  };

  if (declaration.defaultImport) {
    importEntries.push({
      ...entryDefaults,
      name: 'default',
      alias: declaration.defaultImport,
    });
  }
  if (declaration.namespaceImport) {
    importEntries.push({
      ...entryDefaults,
      name: '*',
      alias: declaration.namespaceImport,
    });
  }
  if (declaration.namedImports) {
    importEntries.push(
      ...declaration.namedImports.map((i) => ({
        ...entryDefaults,
        name: i.name,
        alias: i.alias,
      })),
    );
  }
  return importEntries;
}

export function writeImportDeclaration(
  writer: CodeBlockWriter,
  importDeclaration: ImportDeclarationEntry,
): void {
  const {
    namespaceImport,
    defaultImport,
    namedImports = [],
    moduleSpecifier,
    isTypeOnly,
  } = importDeclaration;
  const hasNamedImports = namedImports.length > 0;
  if (!!namespaceImport && (!!defaultImport || hasNamedImports)) {
    throw new Error(
      'Cannot have an import with both namespace and named/default imports!',
    );
  }
  writer.write('import');
  if (!!namespaceImport || !!defaultImport || hasNamedImports) {
    writer.conditionalWrite(isTypeOnly, ' type');
    if (namespaceImport) {
      writer.write(` * as ${namespaceImport}`);
    }
    if (defaultImport) {
      writer.write(` ${defaultImport}`);
    }
    if (hasNamedImports) {
      writer.conditionalWrite(!!defaultImport, ',');
      // sort named imports
      writer.write(' ');
      writer.write('{');
      for (const [i, namedImport] of namedImports.entries()) {
        writer.conditionalWrite(i !== 0, ',');
        writer.write(` ${namedImport.name}`);
        if (namedImport.alias) {
          writer.write(` as ${namedImport.alias}`);
        }
      }
      writer.write(' }');
    }
    writer.write(' from');
  }
  writer.write(' ');
  writer.quote(moduleSpecifier);
  writer.write(';\n');
}

function importEntryToImportDeclaration(
  importEntries: ImportEntry[],
  isTypeOnly: boolean,
  moduleSpecifier: string,
): ImportDeclarationEntry {
  const importsByName = groupBy(importEntries, (entry) => entry.name);

  const importByName: Partial<
    Record<
      string,
      {
        name: string;
        alias?: string;
      }
    >
  > = mapValues(importsByName, (entries) => {
    const { name, alias } = entries[0];
    if (entries.some((e) => e.alias !== alias)) {
      throw new Error(
        `Every alias for ${name} in ${moduleSpecifier} must be the same`,
      );
    }
    return { name, alias };
  });

  const {
    '*': namespaceImportEntry,
    default: defaultImportEntry,
    ...namedImports
  } = importByName;

  const names = Object.keys(namedImports).sort();

  // TODO: Support namespace and default/named imports over 2 lines?

  return {
    moduleSpecifier,
    isTypeOnly,
    namespaceImport: namespaceImportEntry?.alias,
    defaultImport: defaultImportEntry?.alias,
    namedImports: names.map((name) => namedImports[name]).filter(notEmpty),
  };
}

function writeImportDeclarationsForModule(
  writer: CodeBlockWriter,
  importEntries: ImportEntry[],
  moduleSpecifier: string,
): void {
  // handle file-only imports
  if (importEntries.length === 0) {
    writeImportDeclaration(
      writer,
      importEntryToImportDeclaration([], false, moduleSpecifier),
    );
    return;
  }

  // separate out type-only and normal imports with normal imports taking precedence
  const importsByName = groupBy(importEntries, (entry) => entry.name);

  const importsWithNameAndType = Object.keys(importsByName).map((name) => {
    const imports = importsByName[name];
    // check if type only
    const isTypeOnly = imports.every((imp) => imp.isTypeOnly);
    return { isTypeOnly, imports };
  });

  const typeOnlyImports = R.flatten(
    importsWithNameAndType
      .filter((item) => item.isTypeOnly)
      .map((item) => item.imports),
  );
  if (typeOnlyImports.length > 0) {
    writeImportDeclaration(
      writer,
      importEntryToImportDeclaration(typeOnlyImports, true, moduleSpecifier),
    );
  }

  const normalImports = R.flatten(
    importsWithNameAndType
      .filter((item) => !item.isTypeOnly)
      .map((item) => item.imports),
  );
  if (normalImports.length > 0) {
    writeImportDeclaration(
      writer,
      importEntryToImportDeclaration(normalImports, false, moduleSpecifier),
    );
  }
}

export function buildImportMap(importMappers: ImportMapper[]): ImportMap {
  // TODO: Throw error if merge conflict
  return R.mergeAll(importMappers.map((m) => m.getImportMap()));
}

function resolveImportFromImportMap(
  importDeclaration: ImportDeclarationEntry,
  map: ImportMap,
): ImportDeclarationEntry {
  const { moduleSpecifier } = importDeclaration;
  if (!moduleSpecifier.startsWith('%')) {
    return importDeclaration;
  }
  const mappedSpecifierEntry = map[moduleSpecifier];
  if (!mappedSpecifierEntry) {
    throw new Error(`Unknown import map ${moduleSpecifier}`);
  }
  const {
    path: specifierPath,
    allowedImports,
    onImportUsed,
  } = mappedSpecifierEntry;
  const namedImports = importDeclaration.namedImports?.map((i) => i.name) ?? [];
  if (!allowedImports.includes('*')) {
    const missingImport = namedImports.find((i) => !allowedImports.includes(i));
    if (missingImport) {
      throw new Error(
        `${missingImport} is not exported from ${moduleSpecifier}`,
      );
    }
  }
  if (importDeclaration.defaultImport && !allowedImports.includes('default')) {
    throw new Error(`${moduleSpecifier} has no default export`);
  }
  if (onImportUsed) {
    // TODO: Feels a little wonky
    onImportUsed();
  }
  return {
    ...importDeclaration,
    moduleSpecifier: specifierPath,
  };
}

export function writeImportDeclarations(
  writer: CodeBlockWriter,
  imports: ImportDeclarationEntry[],
  fileDirectory: string,
  options: ResolveModuleOptions,
): void {
  // map out imports
  const importMap = buildImportMap(options.importMappers ?? []);
  const mappedImports = imports.map((importDeclaration) =>
    resolveImportFromImportMap(importDeclaration, importMap),
  );
  const resolvedImports = mappedImports.map((i) =>
    resolveImportDeclaration(i, fileDirectory, options),
  );
  const resolvedImportEntries = R.flatten(
    resolvedImports.map((i) => importDeclarationToImportEntries(i)),
  );
  // merge all imports together
  const importsByModule: Partial<Record<string, ImportEntry[]>> = groupBy(
    resolvedImportEntries,
    (i) => i.moduleSpecifier,
  );

  // split out imports that have import entries vs. just a module specifier
  // e.g. the order should look like:
  // import { React } from 'react;
  //
  // import './index.css';

  const allModules = R.uniq(resolvedImports.map((i) => i.moduleSpecifier));
  const modulesWithImportEntries = allModules.filter(
    (moduleSpecifier) =>
      importsByModule[moduleSpecifier] &&
      importsByModule[moduleSpecifier].length > 0,
  );
  const modulesWithoutImportEntries = allModules.filter(
    (moduleSpecifier) =>
      !importsByModule[moduleSpecifier] ||
      importsByModule[moduleSpecifier].length === 0,
  );

  const moduleGroupings = [
    modulesWithImportEntries,
    modulesWithoutImportEntries,
  ];

  for (const [i, modules] of moduleGroupings.entries()) {
    // follow https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md
    const sortedModules = sortByImportOrder(modules, {});

    for (const moduleSpecifier of sortedModules) {
      const importEntries = importsByModule[moduleSpecifier] ?? [];
      writeImportDeclarationsForModule(writer, importEntries, moduleSpecifier);
    }

    if (moduleGroupings[i + 1]?.length) {
      writer.write('\n');
    }
  }
}

export function getImportDeclarationEntries(
  file: SourceFile,
): ImportDeclarationEntry[] {
  return file.getImportDeclarations().map((declaration) => ({
    isTypeOnly: declaration.isTypeOnly(),
    defaultImport: declaration.getDefaultImport()?.getText(),
    namespaceImport: declaration.getNamespaceImport()?.getText(),
    namedImports: declaration.getNamedImports().map((namedImport) => ({
      name: namedImport.getName(),
      alias: namedImport.getAliasNode()?.getText(),
    })),
    moduleSpecifier: declaration.getModuleSpecifier().getLiteralValue(),
  }));
}
