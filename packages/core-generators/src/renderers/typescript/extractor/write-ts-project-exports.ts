import {
  parseGeneratorName,
  type TemplateFileExtractorFile,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { getCommonPathPrefix } from '@halfdomelabs/utils/node';
import { camelCase, pascalCase } from 'change-case';
import { sortBy } from 'es-toolkit';
import path from 'node:path';

import type { TsCodeFragment } from '../fragments/types.js';
import type { TsTemplateFileMetadata } from '../templates/types.js';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { TsCodeUtils } from '../ts-code-utils.js';

/**
 * A project export that represents a single export from a generator.
 */
export interface TsProjectExport {
  /**
   * The name of the export.
   */
  name: string;
  /**
   * The path to the file that contains the export.
   */
  filePath: string;
  /**
   * Whether the export is a type only export.
   */
  isTypeOnly?: boolean;
  /**
   * The source of the import to import into the file, e.g. %configServiceImports
   */
  importSource: string;
  /**
   * The name of the import to import into the file, e.g. configServiceImportsProvider
   */
  providerImportName: string;
  /**
   * The path to the import map file, e.g. src/imports/config-service-imports.ts
   */
  providerPath: string;
  /**
   * The package name of the import, e.g. @halfdomelabs/core-generators
   */
  providerPackage: string;
}

interface WriteTsProjectExportsOptions {
  /**
   * The path to the import map file.
   */
  importMapFilePath: string;
  /**
   * The path of the package
   */
  packagePath: string;
  /**
   * Export group name. If undefined, the export group name will be the generator name.
   */
  exportGroupName?: string;
  /**
   * Whether to export the provider type.
   */
  exportProviderType?: boolean;
  /**
   * The existing imports provider to use.
   */
  existingImportsProvider?: {
    /**
     * The module specifier of the existing imports provider.
     */
    moduleSpecifier: string;
    /**
     * The name of the import schema export.
     */
    importSchemaName: string;
    /**
     * The name of the provider type export.
     */
    providerTypeName: string;
    /**
     * The name of the provider export.
     */
    providerName: string;
  };
}

/**
 * Writes the project exports to the import map file.
 * @param files - The files to write the project exports to.
 * @param outputDirectory - The output directory to write the project exports to.
 * @param generatorName - The name of the generator.
 * @param importMapFilePath - The path to the import map file.
 * @param options - The options for the writeTsProjectExports function.
 * @returns The import map file contents and the project exports.
 */
export function writeTsProjectExports(
  files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  generatorName: string,
  {
    importMapFilePath,
    packagePath,
    existingImportsProvider,
    exportProviderType,
    exportGroupName,
  }: WriteTsProjectExportsOptions,
): {
  importsFileFragment: TsCodeFragment | undefined;
  projectExports: TsProjectExport[];
} {
  // get imports name based off generator name
  const parsedGeneratorName = parseGeneratorName(generatorName);
  const { packageName, generatorBasename } = parsedGeneratorName;
  const exportBasename = exportGroupName ?? generatorBasename;
  const providerNamePascalCase = `${pascalCase(exportBasename)}Imports`;
  const providerNameCamelCase = `${camelCase(exportBasename)}Imports`;
  const providerName = `${exportBasename}-imports`;

  const providerNameVar = existingImportsProvider
    ? existingImportsProvider.providerName
    : `${providerNameCamelCase}Provider`;

  const providerPath = existingImportsProvider
    ? existingImportsProvider.moduleSpecifier.replace(/^@/, packagePath)
    : importMapFilePath;

  const importSource = existingImportsProvider
    ? `%${existingImportsProvider.providerName.replace(/Provider$/, '')}`
    : `%${providerNameCamelCase}`;

  // If the module specifier is relative, use the package name otherwise use the module specifier's package name
  const providerPackage = existingImportsProvider
    ? existingImportsProvider.moduleSpecifier.startsWith('@/')
      ? packageName
      : existingImportsProvider.moduleSpecifier
    : packageName;

  // Extract project exports
  const projectExports: TsProjectExport[] = sortBy(
    files.flatMap((file) =>
      Object.entries(file.metadata.projectExports ?? {}).map(
        ([exportName, { isTypeOnly }]) => ({
          name: exportName,
          isTypeOnly,
          filePath: file.path,
          importSource,
          providerImportName: providerNameVar,
          providerPath,
          providerPackage,
        }),
      ),
    ),
    [(t) => t.name],
  );

  const duplicateExports = projectExports.filter(
    (fileExport, index, self) =>
      self.findIndex((t) => t.name === fileExport.name) !== index,
  );

  if (duplicateExports.length > 0) {
    throw new Error(
      `Duplicate project exports found in template files for generator ${generatorName}: ${duplicateExports.map((fileExport) => fileExport.name).join(', ')}`,
    );
  }

  if (projectExports.length === 0) {
    return {
      importsFileFragment: undefined,
      projectExports: [],
    };
  }

  const isLocalImport = generatorName.startsWith(
    '@halfdomelabs/core-generators#',
  );
  const tsImports = isLocalImport
    ? '@src/renderers/typescript/index.js'
    : '@halfdomelabs/core-generators';

  const commonPathPrefix = getCommonPathPrefix(
    projectExports.map((projectExport) => projectExport.filePath),
  );

  const schemaVarName = `${providerNameCamelCase}Schema`;
  const importsSchemaFragment = TsCodeUtils.templateWithImports(
    tsImportBuilder(['createTsImportMapSchema']).from(tsImports),
  )`
  const ${schemaVarName} = createTsImportMapSchema(
    ${TsCodeUtils.mergeFragmentsAsObject(
      Object.fromEntries(
        projectExports.map((projectExport) => [
          projectExport.name,
          JSON.stringify({
            isTypeOnly: projectExport.isTypeOnly ? true : undefined,
          }),
        ]),
      ),
    )},
  );
  `;

  const providerTypeVarName = `${providerNamePascalCase}Provider`;
  const importsProviderTypeFragment = TsCodeUtils.templateWithImports(
    tsImportBuilder(['TsImportMapProviderFromSchema'])
      .typeOnly()
      .from(tsImports),
  )`
    ${exportProviderType ? 'export ' : ''}type ${providerTypeVarName} = TsImportMapProviderFromSchema<
      typeof ${schemaVarName}
    >;
  `;

  const importsProviderFragment = TsCodeUtils.templateWithImports(
    tsImportBuilder(['createReadOnlyProviderType']).from('@halfdomelabs/sync'),
  )`
    export const ${providerNameVar} = createReadOnlyProviderType<${providerTypeVarName}>(
      ${quot(providerName)},
    );
  `;

  const importProviderDeclaration = TsCodeUtils.mergeFragmentsPresorted(
    [
      importsSchemaFragment,
      importsProviderTypeFragment,
      importsProviderFragment,
    ],
    '\n\n',
  );

  const createImportMapFunctionName = `create${providerNamePascalCase}`;
  const creatorFragment = TsCodeUtils.mergeFragmentsAsObject(
    Object.fromEntries(
      projectExports.map((projectExport) => [
        projectExport.name,
        tsCodeFragment(
          `path.join(importBase, '${projectExport.filePath
            .slice(commonPathPrefix === '.' ? 0 : commonPathPrefix.length + 1)
            .replace(/\.tsx?$/, '.js')}')`,
          [tsImportBuilder().default('path').from('node:path/posix')],
        ),
      ]),
    ),
  );

  const resolvedExistingImportsProvider = existingImportsProvider
    ? existingImportsProvider.moduleSpecifier.startsWith('@/')
      ? path.relative(path.dirname(importMapFilePath), providerPath)
      : providerPath
    : '';

  const providerImports = existingImportsProvider
    ? [
        tsImportBuilder([existingImportsProvider.importSchemaName]).from(
          resolvedExistingImportsProvider,
        ),
        tsImportBuilder([existingImportsProvider.providerTypeName])
          .typeOnly()
          .from(resolvedExistingImportsProvider),
      ]
    : [];

  const createImportMapFunctionFragment = TsCodeUtils.templateWithImports([
    ...providerImports,
    tsImportBuilder(['createTsImportMap']).from(tsImports),
  ])`
    export function ${createImportMapFunctionName}(
      importBase: string,
    ): ${existingImportsProvider?.providerTypeName ?? providerTypeVarName} {
      if (!importBase.startsWith('@/')) {
        throw new Error('importBase must start with @/');
      }

      return createTsImportMap(${
        existingImportsProvider?.importSchemaName ?? schemaVarName
      }, ${creatorFragment});
    }
  `;

  return {
    importsFileFragment: existingImportsProvider
      ? createImportMapFunctionFragment
      : TsCodeUtils.mergeFragmentsPresorted(
          [importProviderDeclaration, createImportMapFunctionFragment],
          '\n\n',
        ),
    projectExports,
  };
}
