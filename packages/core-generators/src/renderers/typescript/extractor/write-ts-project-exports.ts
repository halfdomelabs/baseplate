import {
  parseGeneratorName,
  type TemplateFileExtractorFile,
} from '@halfdomelabs/sync';
import { camelCase, pascalCase } from 'change-case';
import { getCommonPathPrefix } from 'node_modules/@halfdomelabs/utils/dist/paths/get-common-path-prefix.js';

import type { TsTemplateFileMetadata } from '../templates/types.js';

import { tsCodeFragment } from '../fragments/creators.js';
import { tsImportBuilder } from '../imports/builder.js';
import { renderTsCodeFileTemplate } from '../renderers/file.js';
import { TsCodeUtils } from '../ts-code-utils.js';
import { IMPORTS_FILE_TEMPLATE } from './templates/imports-file.js';

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

/**
 * Writes the project exports to the import map file.
 * @param files - The files to write the project exports to.
 * @param outputDirectory - The output directory to write the project exports to.
 * @param generatorName - The name of the generator.
 * @param importMapFilePath - The path to the import map file.
 * @returns The import map file contents and the project exports.
 */
export function writeTsProjectExports(
  files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  outputDirectory: string,
  generatorName: string,
  importMapFilePath: string,
): {
  importsFileContents: string | undefined;
  projectExports: TsProjectExport[];
} {
  // get imports name based off generator name
  const parsedGeneratorName = parseGeneratorName(generatorName);
  const { packageName, generatorBasename } = parsedGeneratorName;
  const providerNamePascalCase = `${pascalCase(generatorBasename)}Imports`;
  const providerNameCamelCase = `${camelCase(generatorBasename)}Imports`;
  const providerName = `${generatorBasename}-imports`;

  const providerNameVar = `${providerNameCamelCase}Provider`;

  // Extract project exports
  const projectExports: TsProjectExport[] = files.flatMap((file) =>
    Object.entries(file.metadata.projectExports ?? {}).map(
      ([exportName, { isTypeOnly }]) => ({
        name: exportName,
        isTypeOnly,
        filePath: file.path,
        importSource: `%${providerNameCamelCase}`,
        providerImportName: providerNameVar,
        providerPath: importMapFilePath,
        providerPackage: packageName,
      }),
    ),
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
      importsFileContents: undefined,
      projectExports: [],
    };
  }

  const isLocalImport = generatorName.startsWith(
    '@halfdomelabs/core-generators#',
  );
  const tsImports = isLocalImport
    ? '@src/renderers/typescript/index.ts'
    : '@halfdomelabs/core-generators';

  const commonPathPrefix = getCommonPathPrefix(
    projectExports.map((projectExport) => projectExport.filePath),
  );

  const importsFileContents = renderTsCodeFileTemplate(
    IMPORTS_FILE_TEMPLATE,
    {
      TPL_TS_IMPORTS: tsImports,

      TPL_IMPORTS_SCHEMA_VAR: `${providerNameCamelCase}Schema`,
      TPL_IMPORTS_SCHEMA: TsCodeUtils.mergeFragmentsAsObject(
        Object.fromEntries(
          projectExports.map((projectExport) => [
            projectExport.name,
            JSON.stringify({
              isTypeOnly: projectExport.isTypeOnly ? true : undefined,
            }),
          ]),
        ),
      ),

      TPL_IMPORTS_PROVIDER_TYPE_VAR: `${providerNamePascalCase}Provider`,

      TPL_IMPORTS_PROVIDER_VAR: providerNameVar,
      TPL_PROVIDER_NAME: providerName,

      TPL_CREATE_IMPORT_MAP_FUNCTION: `create${providerNamePascalCase}`,

      TPL_IMPORT_MAP_CREATOR: TsCodeUtils.mergeFragmentsAsObject(
        Object.fromEntries(
          projectExports.map((projectExport) => [
            projectExport.name,
            tsCodeFragment(
              `path.join(baseDirectory, '${projectExport.filePath.slice(
                commonPathPrefix === '.' ? 0 : commonPathPrefix.length + 1,
              )}')`,
              [tsImportBuilder().default('path').from('node:path/posix')],
            ),
          ]),
        ),
      ),
    },
    {
      importMapProviders: {},
    },
  );

  return {
    importsFileContents,
    projectExports,
  };
}
