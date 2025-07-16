import type { CodeBlockWriter, SourceFile } from 'ts-morph';

import { Project } from 'ts-morph';

import type {
  TsHoistedFragment,
  TsPositionedHoistedFragment,
} from '../fragments/types.js';
import type { TsImportMap } from '../import-maps/types.js';
import type { SortImportDeclarationsOptions } from '../imports/index.js';
import type { TsImportDeclaration } from '../imports/types.js';
import type { TsTemplateFileVariableValue } from '../templates/types.js';
import type { RenderTsTemplateOptions } from './template.js';

import { transformTsImportsWithMap } from '../import-maps/transform-ts-imports-with-map.js';
import { sortImportDeclarations } from '../imports/index.js';
import { mergeTsImportDeclarations } from '../imports/merge-ts-import-declarations.js';
import {
  convertTsMorphImportDeclarationToTsImportDeclaration,
  getSideEffectImportsFromSourceFile,
  getTsMorphImportDeclarationsFromSourceFile,
  replaceImportDeclarationsInSourceFile,
} from '../imports/ts-morph-operations.js';
import { renderTsTemplateToTsCodeFragment } from './template.js';

export interface RenderTsCodeFileTemplateOptions
  extends RenderTsTemplateOptions {
  importSortOptions?: Partial<SortImportDeclarationsOptions>;
  resolveModule?: (moduleSpecifier: string) => string;
}

function mergeImportsAndHoistedFragments(
  file: SourceFile,
  imports: TsImportDeclaration[],
  hoistedFragments: TsHoistedFragment[],
  importMaps: Map<string, TsImportMap>,
  positionedHoistedFragments: TsPositionedHoistedFragment[],
  generatorPaths: Record<string, string>,
  {
    resolveModule,
    importSortOptions,
    includeMetadata,
  }: RenderTsCodeFileTemplateOptions,
): void {
  // Get the import declarations from the source file
  const importDeclarationsFromFile =
    getTsMorphImportDeclarationsFromSourceFile(file);

  // Convert the import declarations to TsImportDeclaration
  const tsImportDeclarations = [
    ...transformTsImportsWithMap(
      importDeclarationsFromFile.map(
        convertTsMorphImportDeclarationToTsImportDeclaration,
      ),
      importMaps,
      generatorPaths,
    ),
    ...imports,
  ];

  const normalizedTsImportDeclarations = tsImportDeclarations.map(
    (declaration) => ({
      ...declaration,
      moduleSpecifier: resolveModule
        ? resolveModule(declaration.moduleSpecifier)
        : declaration.moduleSpecifier,
    }),
  );

  // Sort and group the import declarations
  const groupedImportDeclarations = sortImportDeclarations(
    mergeTsImportDeclarations(normalizedTsImportDeclarations),
    importSortOptions,
  );

  // Combine the hoisted fragments with the positioned hoisted fragments

  // Note: Positioned hoisted fragments are currently limited in their functionality
  // such as not supporting hoisted fragments and no deduplication of keys.
  // This can be improved in the future but since the use-case is very limited,
  // we'll just throw an error if this happens.
  const sortedPositionedHoistedFragments = positionedHoistedFragments.sort(
    (a, b) => a.key.localeCompare(b.key),
  );
  if (
    new Set(sortedPositionedHoistedFragments.map((f) => f.key)).size !==
    sortedPositionedHoistedFragments.length
  ) {
    throw new Error('Positioned hoisted fragments must have unique keys');
  }
  const afterImportsHoistedFragments = [
    ...hoistedFragments,
    ...sortedPositionedHoistedFragments.filter(
      (f) => f.position === 'afterImports',
    ),
  ];
  const beforeImportsHoistedFragments = sortedPositionedHoistedFragments.filter(
    (f) => f.position === 'beforeImports',
  );

  function writeHoistedFragments(
    writer: CodeBlockWriter,
    fragments: TsHoistedFragment[],
  ): void {
    for (const h of fragments) {
      if (includeMetadata) {
        writer.writeLine(`/* HOISTED:${h.key}:START */`);
      }
      writer.writeLine(h.contents);
      if (includeMetadata) {
        writer.writeLine(`/* HOISTED:${h.key}:END */`);
      }
      writer.writeLine('');
    }
  }

  replaceImportDeclarationsInSourceFile(
    file,
    importDeclarationsFromFile,
    groupedImportDeclarations,
    {
      beforeImportsWriter: (writer) => {
        writeHoistedFragments(writer, beforeImportsHoistedFragments);
      },
      afterImportsWriter: (writer) => {
        writeHoistedFragments(writer, afterImportsHoistedFragments);
      },
    },
  );

  // Resolve any side effect imports if necessary
  if (resolveModule) {
    const sideEffectImports = getSideEffectImportsFromSourceFile(file);
    for (const importDeclaration of sideEffectImports) {
      const moduleSpecifier = importDeclaration
        .getModuleSpecifier()
        .getLiteralValue();
      const resolvedModuleSpecifier = resolveModule(moduleSpecifier);
      importDeclaration.setModuleSpecifier(resolvedModuleSpecifier);
    }
  }
}

interface RenderTsCodeFileTemplateInput {
  templateContents: string;
  variables?: Record<string, TsTemplateFileVariableValue>;
  importMapProviders?: Record<string, unknown>;
  positionedHoistedFragments?: TsPositionedHoistedFragment[];
  generatorPaths?: Record<string, string>;
  options?: RenderTsCodeFileTemplateOptions;
}

export function renderTsCodeFileTemplate({
  templateContents,
  variables = {},
  importMapProviders = {},
  positionedHoistedFragments = [],
  generatorPaths = {},
  options = {},
}: RenderTsCodeFileTemplateInput): string {
  // Render the template into a code fragment
  const { contents, imports, hoistedFragments } =
    renderTsTemplateToTsCodeFragment(templateContents, variables, {
      prefix: options.prefix,
      ...options,
    });

  if (
    !imports?.length &&
    !hoistedFragments?.length &&
    Object.keys(generatorPaths).length === 0 &&
    Object.keys(importMapProviders).length === 0 &&
    !/^import\s+/gm.test(contents)
  ) {
    return contents;
  }

  // Create a ts-morph project and source file
  const project = new Project({
    useInMemoryFileSystem: true,
  });
  const file = project.createSourceFile('./file.ts', contents);

  // Merge in imports and hoisted fragments
  mergeImportsAndHoistedFragments(
    file,
    imports ?? [],
    hoistedFragments ?? [],
    new Map(Object.entries(importMapProviders) as [string, TsImportMap][]),
    positionedHoistedFragments,
    generatorPaths,
    options,
  );

  return file.getFullText();
}
