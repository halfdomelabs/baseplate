import type { TemplateFileExtractorFile } from '@halfdomelabs/sync';

import {
  getGenerationConcurrencyLimit,
  TemplateFileExtractor,
} from '@halfdomelabs/sync';
import { mapGroupBy } from '@halfdomelabs/utils';
import { getCommonPathPrefix } from '@halfdomelabs/utils/node';
import { camelCase, constantCase, uniq } from 'es-toolkit';
import path from 'node:path';
import pLimit from 'p-limit';

import type {
  TsTemplateFile,
  TsTemplateFileMetadata,
} from '../templates/types.js';

import {
  TS_TEMPLATE_TYPE,
  tsTemplateFileMetadataSchema,
} from '../templates/types.js';
import { processTsTemplateContent } from './process-ts-template.js';
import { writeTsProjectExports } from './write-ts-project-exports.js';

interface TypescriptCodeEntry {
  codeBlock: string;
  exports: string[];
  imports: string[];
}

export class TsTemplateFileExtractor extends TemplateFileExtractor<
  typeof tsTemplateFileMetadataSchema
> {
  public name = TS_TEMPLATE_TYPE;
  public metadataSchema = tsTemplateFileMetadataSchema;

  protected async extractTemplateFile(
    file: TemplateFileExtractorFile<TsTemplateFileMetadata>,
  ): Promise<
    TypescriptCodeEntry & {
      originalPath: string;
    }
  > {
    const sourceFileContents = await this.readSourceFile(file.path);
    const processedContent = processTsTemplateContent(
      file.metadata,
      sourceFileContents,
    );

    await this.writeTemplateFileIfModified(file, processedContent);

    const templateName = camelCase(file.metadata.name);
    const templateOptions: TsTemplateFile = {
      name: file.metadata.name,
      group: file.metadata.group,
      source: {
        path: file.metadata.template,
      },
      variables: file.metadata.variables ?? {},
      projectExports: file.metadata.projectExports ?? {},
    };

    return {
      codeBlock: `const ${templateName} = createTsTemplateFile(${JSON.stringify(
        templateOptions,
      )});`,
      exports: [templateName],
      imports: ['createTsTemplateFile'],
      originalPath: file.path,
    };
  }

  protected async extractTemplateFilesForGroup(
    groupName: string,
    files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  ): Promise<TypescriptCodeEntry> {
    const results = await Promise.all(
      files.map((file) => this.extractTemplateFile(file)),
    );

    const originalPaths = results.map((result) => result.originalPath);
    // identify greatest common prefix
    const commonPathPrefix = getCommonPathPrefix(originalPaths);

    const groupNameVariable = `${camelCase(groupName)}Group`;

    const groupBlock = `const ${groupNameVariable} = createTsTemplateGroup({
      templates: {
        ${results
          .map(
            (result) => `${result.exports[0]}: {
          destination: '${path.relative(commonPathPrefix, result.originalPath)}',
          template: ${result.exports[0]}
        }`,
          )
          .join(',\n')}
      }
    });`;

    return {
      codeBlock: [
        ...results.map((result) => result.codeBlock),
        groupBlock,
      ].join('\n\n'),
      exports: results.flatMap((result) => result.exports), // Export individual templates
      imports: uniq(results.flatMap((result) => result.imports)).toSorted(),
    };
  }

  protected async extractTemplateFilesForGenerator(
    generatorName: string,
    files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  ): Promise<void> {
    const extractLimit = pLimit(getGenerationConcurrencyLimit());

    const { importsFileContents } = writeTsProjectExports(
      files,
      this.getProjectBaseDirectory(),
      generatorName,
    );

    if (importsFileContents) {
      await this.writeGeneratedTypescriptFileIfModified(
        generatorName,
        'ts-import-maps.ts',
        importsFileContents,
      );
    }

    const filesByGroups = mapGroupBy(
      files.filter((file) => file.metadata.group),
      (file) => file.metadata.group ?? '',
    );
    const filesWithoutGroups = files.filter((file) => !file.metadata.group);

    const results = await Promise.all([
      ...[...filesByGroups].map(([groupName, files]) =>
        extractLimit(() => this.extractTemplateFilesForGroup(groupName, files)),
      ),
      ...filesWithoutGroups.map((file) =>
        extractLimit(() => this.extractTemplateFile(file)),
      ),
    ]);

    if (!generatorName.includes('#')) {
      throw new Error(
        `Generator name ${generatorName} is not in the correct format. Please use the format <package-name>#<generator-name>.`,
      );
    }
    const templatesVariableName = `${constantCase(generatorName.split('#')[1])}_TS_TEMPLATES`;

    const allImports = uniq(
      results.flatMap((result) => result.imports),
    ).toSorted();

    // If the generator is a core-generators generator, use a relative import
    // Otherwise, use the core-generators package entry point
    const coreGenImportPath = generatorName.startsWith(
      '@halfdomelabs/core-generators#',
    )
      ? '@src/renderers/typescript/index.js'
      : '@halfdomelabs/core-generators';

    await this.writeGeneratedTypescriptFileIfModified(
      generatorName,
      'ts-templates.ts',
      [
        `import { ${allImports.join(', ')} } from '${coreGenImportPath}';`,
        '', // Add a newline after imports
        ...results.map((result) => result.codeBlock),
        '', // Add a newline before export
        `export const ${templatesVariableName} = {`,
        `  ${results.flatMap((result) => result.exports).join(',\n  ')}`,
        `};`,
      ].join('\n'),
    );
  }

  async extractTemplateFiles(
    files: TemplateFileExtractorFile<TsTemplateFileMetadata>[],
  ): Promise<void> {
    const filesByGenerator = mapGroupBy(
      files,
      (file) => file.metadata.generator,
    );
    for (const [generator, filesInGenerator] of filesByGenerator) {
      await this.extractTemplateFilesForGenerator(generator, filesInGenerator);
    }
  }
}
