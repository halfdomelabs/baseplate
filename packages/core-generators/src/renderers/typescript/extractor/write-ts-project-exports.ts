import type { TemplateFileExtractorFile } from '@halfdomelabs/sync';

import { camelCase, pascalCase } from 'change-case';
import { getCommonPathPrefix } from 'node_modules/@halfdomelabs/utils/dist/paths/get-common-path-prefix.js';
import path from 'node:path';

import type { TsTemplateFileMetadata } from '../templates/types.js';

export interface TsProjectExport {
  generatorName: string;
  name: string;
  projectRelativePath: string;
  isTypeOnly?: boolean;
}

const generatorSubnameRegex = /#(?:[^/]+\/)?([^#]+)$/;

export function writeTsProjectExports(
  files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  outputDirectory: string,
  generatorName: string,
): {
  importsFileContents: string | undefined;
  projectExports: TsProjectExport[];
} {
  // Extract project exports
  const projectExports: TsProjectExport[] = files.flatMap((file) =>
    Object.entries(file.metadata.projectExports ?? {}).map(
      ([exportName, { isTypeOnly }]) => ({
        name: exportName,
        generatorName: file.metadata.generator,
        isTypeOnly,
        projectRelativePath: path.relative(outputDirectory, file.path),
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

  // get imports name based off generator name
  const generatorSubname = generatorSubnameRegex.exec(generatorName)?.[1];
  if (!generatorSubname) {
    throw new Error(
      `Could not get imports name for generator ${generatorName}`,
    );
  }
  const providerNamePascalCase = `${pascalCase(generatorSubname)}Imports`;
  const providerNameCamelCase = `${camelCase(generatorSubname)}Imports`;
  const providerName = `${generatorSubname}-imports`;

  const isLocalImport = generatorName.startsWith(
    '@halfdomelabs/core-generators#',
  );
  const tsImports = isLocalImport
    ? '@src/renderers/typescript/index.ts'
    : '@halfdomelabs/core-generators';

  const commonPathPrefix = getCommonPathPrefix(
    projectExports.map((projectExport) => projectExport.projectRelativePath),
  );

  const importMapSchema = `{
    ${projectExports
      .map(
        (projectExport) =>
          `${projectExport.name}: {${projectExport.isTypeOnly ? ' isTypeOnly: true ' : ''}}`,
      )
      .join(',\n')}
  }`;

  const providerImportsSchema = `${providerNameCamelCase}Schema`;
  const providerImportsProviderType = `${providerNamePascalCase}Provider`;
  const providerImportsProvider = `${providerNameCamelCase}Provider`;
  const createImportMapFunction = `create${providerNamePascalCase}`;

  const externalImports = `
  import type { TsImportMapProviderFromSchema } from '${tsImports}';

  import {
    createTsImportMapProvider,
    createTsImportMapSchema,
  } from '${tsImports}';
  `.trim();

  // Write imports file
  const importsFileContents = `
  ${isLocalImport ? '' : externalImports}
  import { createReadOnlyProviderType } from '@halfdomelabs/sync';
  import path from 'node:path/posix';
  
  ${isLocalImport ? externalImports : ''}

  export const ${providerImportsSchema} = createTsImportMapSchema(${importMapSchema});

  export type ${providerImportsProviderType} = TsImportMapProviderFromSchema<typeof ${providerImportsSchema}>;

  export const ${providerImportsProvider} = createReadOnlyProviderType<${providerImportsProviderType}>('${providerName}');

  export function ${createImportMapFunction}(baseDirectory: string): ${providerImportsProviderType} {
    return createTsImportMapProvider(${providerImportsSchema}, {
      ${projectExports.map((projectExport) => `${projectExport.name}: path.join(baseDirectory, '${projectExport.projectRelativePath.slice(commonPathPrefix === '.' ? 0 : commonPathPrefix.length + 1)}')`).join(',\n')}
    });
  }
  `;

  return {
    importsFileContents,
    projectExports,
  };
}
