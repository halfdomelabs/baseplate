import {
  parseGeneratorName,
  type TemplateFileExtractorFile,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { getCommonPathPrefix } from '@halfdomelabs/utils/node';
import { camelCase, pascalCase } from 'change-case';
import { sortBy } from 'es-toolkit';

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
  generatorName: string,
  importMapFilePath: string,
): {
  importsFileFragment: TsCodeFragment | undefined;
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
  const projectExports: TsProjectExport[] = sortBy(
    files.flatMap((file) =>
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
    type ${providerTypeVarName} = TsImportMapProviderFromSchema<
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
  const createImportMapFunctionFragment = TsCodeUtils.templateWithImports(
    tsImportBuilder(['createTsImportMap']).from(tsImports),
  )`
    export function ${createImportMapFunctionName}(
      importBase: string,
    ): ${providerTypeVarName} {
      if (!importBase.startsWith('@/')) {
        throw new Error('importBase must start with @/');
      }

      return createTsImportMap(${schemaVarName}, ${creatorFragment});
    }
  `;

  return {
    importsFileFragment: TsCodeUtils.mergeFragmentsPresorted(
      [importProviderDeclaration, createImportMapFunctionFragment],
      '\n\n',
    ),
    projectExports,
  };
}
