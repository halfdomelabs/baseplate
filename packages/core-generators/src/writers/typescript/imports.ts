import _ from 'lodash';
import path from 'path';
import * as R from 'ramda';
import { CodeBlockWriter, SourceFile } from 'ts-morph';

import { sortByImportOrder } from './importOrder.js';
import { ImportMap, ImportMapper } from '../../providers/index.js';

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

interface ResolveModuleOptions {
  importMappers?: ImportMapper[];
  pathMapEntries?: PathMapEntry[];
}

export function resolveModule(
  moduleSpecifier: string,
  directory: string,
  { pathMapEntries }: ResolveModuleOptions = {},
): string {
  // if not relative import, just return directly
  if (!moduleSpecifier.startsWith('@/')) {
    return moduleSpecifier;
  }
  // figure out relative directory
  const absolutePath = moduleSpecifier.substring(2);
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
    return pathEntry.to + absolutePath.substring(pathEntry.from.length);
  })();

  return typescriptPathImport &&
    typescriptPathImport.length < relativePathImport.length
    ? typescriptPathImport
    : relativePathImport;
}

function resolveImportDeclaration(
  declaration: ImportDeclarationEntry,
  directory: string,
  options?: ResolveModuleOptions,
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
  const hasNamedImports = !!namedImports.length;
  if (namespaceImport && (defaultImport || hasNamedImports)) {
    throw new Error(
      'Cannot have an import with both namespace and named/default imports!',
    );
  }
  writer.write('import');
  if (namespaceImport || defaultImport || hasNamedImports) {
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
      namedImports.forEach((namedImport, i) => {
        writer.conditionalWrite(i !== 0, ',');
        writer.write(` ${namedImport.name}`);
        if (namedImport.alias) {
          writer.write(` as ${namedImport.alias}`);
        }
      });
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
  const importsByName = _.groupBy(importEntries, 'name');

  const importByName = R.mapObjIndexed((entries) => {
    const { name, alias } = entries[0];
    if (entries.some((e) => e.alias !== alias)) {
      throw new Error(
        `Every alias for ${name} in ${moduleSpecifier} must be the same`,
      );
    }
    return { name, alias };
  }, importsByName);

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
    namedImports: names.map((name) => namedImports[name]),
  };
}

function writeImportDeclarationsForModule(
  writer: CodeBlockWriter,
  importEntries: ImportEntry[],
  moduleSpecifier: string,
): void {
  // handle file-only imports
  if (!importEntries.length) {
    writeImportDeclaration(
      writer,
      importEntryToImportDeclaration([], false, moduleSpecifier),
    );
    return;
  }

  // separate out type-only and normal imports with normal imports taking precedence
  const importsByName = _.groupBy(importEntries, 'name');

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
  if (typeOnlyImports.length) {
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
  if (normalImports.length) {
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
  options?: ResolveModuleOptions,
): void {
  // map out imports
  const importMap = buildImportMap(options?.importMappers || []);
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
  const importsByModule = _.groupBy(
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
    (moduleSpecifier) => !importsByModule[moduleSpecifier]?.length,
  );

  const moduleGroupings = [
    modulesWithImportEntries,
    modulesWithoutImportEntries,
  ];

  moduleGroupings.forEach((modules, i) => {
    // follow https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/order.md
    const sortedModules = sortByImportOrder(modules, {});

    sortedModules.forEach((moduleSpecifier) => {
      const importEntries = importsByModule[moduleSpecifier] || [];
      writeImportDeclarationsForModule(writer, importEntries, moduleSpecifier);
    });

    if (moduleGroupings[i + 1]?.length) {
      writer.write('\n');
    }
  });
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
