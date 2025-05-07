import type { SourceFile } from 'ts-morph';

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
  writeGroupedImportDeclarationsWithCodeBlockWriter,
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

  // Remove the existing import declarations
  for (const i of importDeclarationsFromFile) i.remove();

  // Combine the hoisted fragments with the positioned hoisted fragments
  const afterImportsHoistedFragments = [
    ...hoistedFragments,
    ...positionedHoistedFragments.filter((f) => f.position === 'afterImports'),
  ];
  const beforeImportsHoistedFragments = positionedHoistedFragments.filter(
    (f) => f.position === 'beforeImports',
  );

  function writeHoistedFragments(fragments: TsHoistedFragment[]): void {
    file.insertText(0, (writer) => {
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
    });
  }

  // Write the afterImports hoisted fragments to the source file
  writeHoistedFragments(afterImportsHoistedFragments);

  // Write the grouped import declarations to the source file
  file.insertText(0, (writer) => {
    writeGroupedImportDeclarationsWithCodeBlockWriter(
      writer,
      groupedImportDeclarations,
    );
  });

  // Write the beforeImports hoisted fragments to the source file
  writeHoistedFragments(beforeImportsHoistedFragments);

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
  options?: RenderTsCodeFileTemplateOptions;
}

export function renderTsCodeFileTemplate({
  templateContents,
  variables = {},
  importMapProviders = {},
  positionedHoistedFragments = [],
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
    options,
  );

  return file.getFullText();
}
