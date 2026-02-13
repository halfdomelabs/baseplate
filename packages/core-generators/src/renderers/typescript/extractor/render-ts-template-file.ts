import { mapKeyBy, mapValuesOfMap } from '@baseplate-dev/utils';

import type {
  TsTemplateFileImportProvider,
  TsTemplateVariableMap,
} from '../templates/types.js';
import type { TsTemplateImportLookupContext } from './organize-ts-template-imports.js';

import { extractTsTemplateVariables } from './extract-ts-template-variables.js';
import { organizeTsTemplateImports } from './organize-ts-template-imports.js';

export interface WriteTsTemplateFileContext extends TsTemplateImportLookupContext {
  generatorName: string;
}

export async function renderTsTemplateFile(
  sourceAbsolutePath: string,
  contents: string,
  context: WriteTsTemplateFileContext,
): Promise<{
  contents: string;
  variables: TsTemplateVariableMap;
  importProviders: Record<string, TsTemplateFileImportProvider>;
  referencedGeneratorTemplates: Set<string>;
}> {
  const { content: contentsWithVariables, variables } =
    extractTsTemplateVariables(contents);

  const {
    usedProjectExports,
    contents: organizedContents,
    referencedGeneratorTemplates,
  } = await organizeTsTemplateImports(
    sourceAbsolutePath,
    contentsWithVariables,
    context,
  );

  const importProviders = mapValuesOfMap(
    mapKeyBy(
      usedProjectExports,
      (projectExport) => projectExport.providerImportName,
    ),
    (projectExport): TsTemplateFileImportProvider => ({
      importName: projectExport.providerImportName,
      packagePathSpecifier: projectExport.providerPackagePathSpecifier,
    }),
  );

  let processedContent = organizedContents;
  if (organizedContents.startsWith('#!')) {
    // shebang lines must always be the first line
    const contentLines = organizedContents.split('\n');
    processedContent = `${contentLines[0]}\n// @ts-nocheck\n\n${contentLines.slice(1).join('\n')}`;
  } else {
    processedContent = `// @ts-nocheck\n\n${organizedContents}`;
  }

  return {
    contents: processedContent,
    variables,
    importProviders: Object.fromEntries(importProviders),
    referencedGeneratorTemplates,
  };
}
