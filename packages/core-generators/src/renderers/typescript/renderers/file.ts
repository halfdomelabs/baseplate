import type { SourceFile } from 'ts-morph';

import { readFile } from 'node:fs/promises';
import { Project } from 'ts-morph';

import type { TsHoistedFragment } from '../fragments/types.js';
import type { SortImportDeclarationsOptions } from '../imports/index.js';
import type { TsImportDeclaration } from '../imports/types.js';
import type {
  InferTsCodeTemplateVariablesFromMap,
  TsCodeFileTemplate,
  TsCodeTemplateVariableMap,
} from '../templates/types.js';
import type { RenderTsTemplateOptions } from './template.js';

import { sortImportDeclarations } from '../imports/index.js';
import { mergeTsImportDeclarations } from '../imports/merge-ts-import-declarations.js';
import {
  convertTsMorphImportDeclarationToTsImportDeclaration,
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
  { resolveModule, importSortOptions }: RenderTsCodeFileTemplateOptions,
): void {
  // Get the import declarations from the source file
  const importDeclarationsFromFile =
    getTsMorphImportDeclarationsFromSourceFile(file);

  // Convert the import declarations to TsImportDeclaration
  const tsImportDeclarations = [
    ...importDeclarationsFromFile.map(
      convertTsMorphImportDeclarationToTsImportDeclaration,
    ),
    ...imports,
  ];

  const normalizedTsImportDeclarations = tsImportDeclarations.map(
    (declaration) => ({
      ...declaration,
      source: resolveModule
        ? resolveModule(declaration.source)
        : declaration.source,
    }),
  );

  // Sort and group the import declarations
  const groupedImportDeclarations = sortImportDeclarations(
    mergeTsImportDeclarations(normalizedTsImportDeclarations),
    importSortOptions,
  );

  // Remove the existing import declarations
  for (const i of importDeclarationsFromFile) i.remove();

  const afterImportsHoistedFragments = hoistedFragments.filter(
    (h) => !h.position || h.position === 'afterImports',
  );
  const beforeImportsHoistedFragments = hoistedFragments.filter(
    (h) => h.position === 'beforeImports',
  );

  // Write the afterImports hoisted fragments to the source file
  file.insertText(0, (writer) => {
    for (const h of afterImportsHoistedFragments) {
      writer.writeLine(h.fragment.contents);
      writer.writeLine('');
    }
  });

  // Write the grouped import declarations to the source file
  file.insertText(0, (writer) => {
    writeGroupedImportDeclarationsWithCodeBlockWriter(
      writer,
      groupedImportDeclarations,
    );
  });

  // Write the beforeImports hoisted fragments to the source file
  file.insertText(0, (writer) => {
    for (const h of beforeImportsHoistedFragments) {
      writer.writeLine(h.fragment.contents);
      writer.writeLine('');
    }
  });
}

export async function renderTsCodeFileTemplate<
  TVariables extends TsCodeTemplateVariableMap,
>(
  template: TsCodeFileTemplate<TVariables>,
  variables: InferTsCodeTemplateVariablesFromMap<TVariables>,
  options: RenderTsCodeFileTemplateOptions,
): Promise<string> {
  const rawTemplate =
    'path' in template
      ? await readFile(template.path, 'utf8')
      : template.contents;

  // Render the template into a code fragment
  const { contents, imports, hoistedFragments } =
    renderTsTemplateToTsCodeFragment(rawTemplate, variables, options);

  if (!imports?.length && !hoistedFragments?.length) {
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
    options,
  );

  return file.getText();
}
