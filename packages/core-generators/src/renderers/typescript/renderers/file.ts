import type { InferProviderType, ProviderType } from '@halfdomelabs/sync';
import type { SourceFile } from 'ts-morph';

import { Project } from 'ts-morph';

import type { TsHoistedFragment } from '../fragments/types.js';
import type { TsImportMap, TsImportMapProvider } from '../import-maps/types.js';
import type { SortImportDeclarationsOptions } from '../imports/index.js';
import type { TsImportDeclaration } from '../imports/types.js';
import type { TsTemplateFileVariableValue } from '../templates/types.js';
import type { RenderTsTemplateOptions } from './template.js';

import { transformTsImportsWithMap } from '../import-maps/transform-ts-imports-with-map.js';
import { sortImportDeclarations } from '../imports/index.js';
import { mergeTsImportDeclarations } from '../imports/merge-ts-import-declarations.js';
import {
  convertTsMorphImportDeclarationToTsImportDeclaration,
  getTsMorphImportDeclarationsFromSourceFile,
  writeGroupedImportDeclarationsWithCodeBlockWriter,
} from '../imports/ts-morph-operations.js';
import { renderTsTemplateToTsCodeFragment } from './template.js';

interface RenderTsCodeFileTemplateOptionsBase extends RenderTsTemplateOptions {
  importSortOptions?: Partial<SortImportDeclarationsOptions>;
  resolveModule?: (moduleSpecifier: string) => string;
}

export type InferImportMapProvidersFromProviderTypeMap<
  T extends Record<string, ProviderType> | undefined,
> = {
  [K in keyof T]: InferProviderType<T[K]>;
};

export interface RenderTsCodeFileTemplateOptions<
  T extends Record<string, ProviderType> | undefined = Record<
    never,
    ProviderType
  >,
> extends RenderTsCodeFileTemplateOptionsBase {
  importMapProviders: InferImportMapProvidersFromProviderTypeMap<T>;
}

function mergeImportsAndHoistedFragments(
  file: SourceFile,
  imports: TsImportDeclaration[],
  hoistedFragments: TsHoistedFragment[],
  importMaps: Map<string, TsImportMap>,
  {
    resolveModule,
    importSortOptions,
    includeMetadata,
  }: RenderTsCodeFileTemplateOptionsBase,
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

  function writeHoistedFragments(fragments: TsHoistedFragment[]): void {
    file.insertText(0, (writer) => {
      for (const h of fragments) {
        if (includeMetadata) {
          writer.writeLine(`/* HOISTED:${h.key}:START */`);
        }
        writer.writeLine(h.fragment.contents);
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
}

export function renderTsCodeFileTemplate<
  TImportMapProviders extends Record<string, ProviderType> = Record<
    never,
    ProviderType
  >,
>(
  templateContents: string,
  variables: Record<string, TsTemplateFileVariableValue>,
  options: RenderTsCodeFileTemplateOptions<TImportMapProviders>,
): string {
  // Render the template into a code fragment
  const { contents, imports, hoistedFragments } =
    renderTsTemplateToTsCodeFragment(templateContents, variables, {
      prefix: options.prefix,
      ...options,
    });

  if (
    !imports?.length &&
    !hoistedFragments?.length &&
    Object.keys(options.importMapProviders).length === 0
  ) {
    return contents;
  }

  // Create a ts-morph project and source file
  const project = new Project({
    useInMemoryFileSystem: true,
  });
  const file = project.createSourceFile('./file.ts', contents);

  const { importMapProviders, ...restOptions } = options;

  const importMapProvidersMap = new Map(
    Object.entries(importMapProviders).map(([key, value]) => {
      const provider = value as TsImportMapProvider<TsImportMap>;
      if (!('importMap' in provider)) {
        throw new Error('Import map provider must have an importMap property');
      }

      return [key, provider.importMap];
    }),
  );

  // Merge in imports and hoisted fragments
  mergeImportsAndHoistedFragments(
    file,
    imports ?? [],
    hoistedFragments ?? [],
    importMapProvidersMap,
    restOptions,
  );

  return file.getText();
}
